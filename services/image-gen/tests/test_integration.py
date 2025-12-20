"""
Integration tests for the image-gen service.

Tests the full pipeline: Health check → Queue → ComfyUI → Retrieve image.
Identifies issues with concurrent requests, timeouts, and error handling.
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Any
from urllib import request
from urllib.error import URLError

import pytest

# Service URLs
IMAGE_GEN_URL = "http://localhost:8420"
COMFYUI_URL = "http://localhost:8188"


# ============================================
# FIXTURES
# ============================================


@pytest.fixture(scope="module")
def ensure_services():
    """Verify both services are running before tests."""
    errors = []

    # Check image-gen service
    try:
        req = request.Request(f"{IMAGE_GEN_URL}/health")
        with request.urlopen(req, timeout=3) as resp:
            if resp.status != 200:
                errors.append(f"image-gen unhealthy: status {resp.status}")
    except URLError as e:
        errors.append(f"image-gen not reachable at {IMAGE_GEN_URL}: {e}")

    # Check ComfyUI
    try:
        req = request.Request(f"{COMFYUI_URL}/system_stats")
        with request.urlopen(req, timeout=5) as resp:
            if resp.status != 200:
                errors.append(f"ComfyUI unhealthy: status {resp.status}")
            else:
                stats = json.loads(resp.read())
                vram_free = stats.get("devices", [{}])[0].get("vram_free", 0)
                if vram_free < 1_000_000_000:  # Less than 1GB free
                    errors.append(f"ComfyUI low VRAM: {vram_free / 1e9:.1f}GB free")
    except URLError as e:
        errors.append(f"ComfyUI not reachable at {COMFYUI_URL}: {e}")

    if errors:
        pytest.skip(f"Services not ready: {'; '.join(errors)}")


# ============================================
# HEALTH CHECK TESTS
# ============================================


class TestHealthChecks:
    """Test service health and status endpoints."""

    def test_image_gen_health(self, ensure_services):
        """Health endpoint should return ok."""
        req = request.Request(f"{IMAGE_GEN_URL}/health")
        with request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read())
            assert data["status"] == "ok"

    def test_image_gen_status(self, ensure_services):
        """Status endpoint should show ComfyUI connected."""
        req = request.Request(f"{IMAGE_GEN_URL}/status")
        with request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            assert data["comfyui_connected"] is True
            assert data["status"] == "ready"

    def test_comfyui_system_stats(self, ensure_services):
        """ComfyUI should report system stats including GPU."""
        req = request.Request(f"{COMFYUI_URL}/system_stats")
        with request.urlopen(req, timeout=5) as resp:
            stats = json.loads(resp.read())
            assert "devices" in stats
            assert len(stats["devices"]) > 0
            # Should have a CUDA device
            device = stats["devices"][0]
            assert "cuda" in device.get("name", "").lower() or device.get("type") == "cuda"


# ============================================
# SINGLE GENERATION TESTS
# ============================================


class TestSingleGeneration:
    """Test single card art generation."""

    def test_generate_attack_card(self, ensure_services):
        """Generate a simple attack card art."""
        payload = {
            "card_id": "test_attack_001",
            "name": "Flame Strike",
            "description": "Deal 10 fire damage.",
            "theme": "attack",
            "element": "fire",
            "rarity": "common",
        }

        data = json.dumps(payload).encode()
        req = request.Request(
            f"{IMAGE_GEN_URL}/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        start = time.time()
        with request.urlopen(req, timeout=60) as resp:
            elapsed = time.time() - start
            result = json.loads(resp.read())

        assert result["card_id"] == "test_attack_001"
        assert result["filename"].endswith(".webp")
        assert result["url"].startswith("/images/")
        assert len(result["prompt"]) > 50  # Has meaningful prompt

        print(f"Generation took {elapsed:.1f}s")
        assert elapsed < 30, f"Generation too slow: {elapsed:.1f}s"

    def test_generate_skill_card(self, ensure_services):
        """Generate a skill card art."""
        payload = {
            "card_id": "test_skill_001",
            "name": "Ice Shield",
            "description": "Gain 8 block.",
            "theme": "skill",
            "element": "ice",
            "rarity": "uncommon",
        }

        data = json.dumps(payload).encode()
        req = request.Request(
            f"{IMAGE_GEN_URL}/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())

        assert result["card_id"] == "test_skill_001"
        assert "ice" in result["prompt"].lower() or "frost" in result["prompt"].lower()

    def test_generate_power_card(self, ensure_services):
        """Generate a power card art."""
        payload = {
            "card_id": "test_power_001",
            "name": "Demon Form",
            "description": "Gain 3 strength at the start of each turn.",
            "theme": "power",
            "element": "void",
            "rarity": "rare",
        }

        data = json.dumps(payload).encode()
        req = request.Request(
            f"{IMAGE_GEN_URL}/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())

        assert result["card_id"] == "test_power_001"

    def test_retrieve_generated_image(self, ensure_services):
        """Generated image should be retrievable."""
        # First generate
        payload = {
            "card_id": "test_retrieve_001",
            "name": "Test Card",
            "description": "A test card.",
            "theme": "attack",
        }

        data = json.dumps(payload).encode()
        req = request.Request(
            f"{IMAGE_GEN_URL}/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())

        # Then retrieve
        image_url = f"{IMAGE_GEN_URL}{result['url']}"
        img_req = request.Request(image_url)

        with request.urlopen(img_req, timeout=5) as resp:
            image_data = resp.read()

        # WebP magic bytes
        assert image_data[:4] == b'RIFF'
        assert b'WEBP' in image_data[:12]
        assert len(image_data) > 10000  # Should be meaningful size


# ============================================
# CONCURRENT GENERATION TESTS
# ============================================


class TestConcurrentGeneration:
    """Test concurrent card generation - the likely failure point."""

    def test_two_concurrent_requests(self, ensure_services):
        """Two concurrent requests should both succeed."""
        import concurrent.futures

        def generate_card(card_id: str, name: str) -> dict[str, Any]:
            payload = {
                "card_id": card_id,
                "name": name,
                "description": f"Test card {card_id}",
                "theme": "attack",
            }
            data = json.dumps(payload).encode()
            req = request.Request(
                f"{IMAGE_GEN_URL}/generate",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read())

        start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(generate_card, "concurrent_001", "Fire Slash")
            future2 = executor.submit(generate_card, "concurrent_002", "Ice Blast")

            result1 = future1.result(timeout=120)
            result2 = future2.result(timeout=120)

        elapsed = time.time() - start

        assert result1["card_id"] == "concurrent_001"
        assert result2["card_id"] == "concurrent_002"

        # Both should complete in reasonable time
        print(f"Two concurrent generations took {elapsed:.1f}s")
        # Should be less than 2x single generation due to batching
        assert elapsed < 60, f"Concurrent generation too slow: {elapsed:.1f}s"

    def test_three_concurrent_requests(self, ensure_services):
        """Three concurrent requests - matches reward screen pattern."""
        import concurrent.futures

        def generate_card(card_id: str) -> dict[str, Any]:
            payload = {
                "card_id": card_id,
                "name": f"Card {card_id}",
                "description": "A generated card.",
                "theme": "attack",
            }
            data = json.dumps(payload).encode()
            req = request.Request(
                f"{IMAGE_GEN_URL}/generate",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read())

        start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(generate_card, f"reward_{i}")
                for i in range(3)
            ]

            results = [f.result(timeout=120) for f in futures]

        elapsed = time.time() - start

        assert len(results) == 3
        card_ids = {r["card_id"] for r in results}
        assert card_ids == {"reward_0", "reward_1", "reward_2"}

        print(f"Three concurrent generations took {elapsed:.1f}s")


# ============================================
# ERROR HANDLING TESTS
# ============================================


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_missing_required_fields(self, ensure_services):
        """Missing required fields should return 422."""
        payload = {"card_id": "test"}  # Missing name, description

        data = json.dumps(payload).encode()
        req = request.Request(
            f"{IMAGE_GEN_URL}/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with request.urlopen(req, timeout=5):
                pytest.fail("Should have raised HTTPError")
        except request.HTTPError as e:
            assert e.code == 422  # Validation error

    def test_invalid_theme(self, ensure_services):
        """Invalid theme should return validation error."""
        payload = {
            "card_id": "test",
            "name": "Test",
            "description": "Test",
            "theme": "invalid_theme",
        }

        data = json.dumps(payload).encode()
        req = request.Request(
            f"{IMAGE_GEN_URL}/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with request.urlopen(req, timeout=5):
                pytest.fail("Should have raised HTTPError")
        except request.HTTPError as e:
            assert e.code == 422

    def test_nonexistent_image(self, ensure_services):
        """Requesting nonexistent image should 404."""
        req = request.Request(f"{IMAGE_GEN_URL}/images/nonexistent_12345.webp")

        try:
            with request.urlopen(req, timeout=5):
                pytest.fail("Should have raised HTTPError")
        except request.HTTPError as e:
            assert e.code == 404


# ============================================
# PERFORMANCE TESTS
# ============================================


class TestPerformance:
    """Test generation performance characteristics."""

    def test_generation_time_baseline(self, ensure_services):
        """Establish baseline generation time."""
        times = []

        for i in range(3):
            payload = {
                "card_id": f"perf_test_{i}",
                "name": f"Perf Card {i}",
                "description": "Performance test card.",
                "theme": "attack",
            }

            data = json.dumps(payload).encode()
            req = request.Request(
                f"{IMAGE_GEN_URL}/generate",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            start = time.time()
            with request.urlopen(req, timeout=60) as resp:
                json.loads(resp.read())
            times.append(time.time() - start)

        avg_time = sum(times) / len(times)
        print(f"Generation times: {times}")
        print(f"Average: {avg_time:.2f}s")

        # With turbo model (10 steps), should be fast
        assert avg_time < 15, f"Average generation too slow: {avg_time:.2f}s"


# ============================================
# RUN TESTS
# ============================================


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
