# Task Completion Checklist

## Before Claiming Done

### 1. Type Check
```bash
npx tsc --noEmit
```
Must pass with no errors.

### 2. Lint
```bash
npm run lint
```
Fix any ESLint errors.

### 3. Test
```bash
npm run test
```
All tests must pass.

### 4. Build Verification
```bash
npm run build
```
Production build must succeed.

### 5. Manual Testing
- Run `npm run dev`
- Test the feature/fix in browser
- Check browser console for errors

## Content Changes

### Adding Cards
1. Add to `src/game/cards.ts` CARDS array
2. Follow existing card structure
3. Test card plays correctly in combat

### Adding Monsters
1. Add to `MONSTERS` in `src/game/new-game.ts`
2. Reference in room definitions
3. Test monster spawns and AI works

### Adding Rooms
1. Add to `ROOMS` in `src/content/rooms.ts`
2. Specify type, monsters, metadata
3. Test room appears in dungeon deck

### Adding Powers/Buffs
1. Add to power definitions in `src/game/powers.ts`
2. Add interface to `src/types/index.ts` if needed
3. Handle in `applyAction()` if special logic needed

## State Changes

If modifying state shape:
1. Update interface in `src/types/index.ts`
2. Update `applyAction()` in `src/game/actions.ts`
3. Update any affected components
4. Test state persistence (Zustand/Dexie)

## Git Workflow

```bash
git status
git diff
git add <files>
git commit -m "feat/fix: description"
```
