# 🚀 .gitignore Quick Reference Card

## ❌ Your 4 Main Mistakes

### 1. **Used Wildcard Without Exception**
```gitignore
*.env    # ❌ Matches .env.example too!
```
**Fix:** Add exception immediately after
```gitignore
*.env
!.env.example    # ✅ Exception for template
```

### 2. **Didn't Test the Pattern**
- Added pattern → Assumed it worked → Committed → Found out later it's broken
**Fix:** Always test with `git check-ignore -v .env.example`

### 3. **Copy-Pasted Without Understanding**
- Used template/other project's `.gitignore` without reading it
**Fix:** Understand each pattern before using it

### 4. **Forgot Template Files Exist**
- Added `*.env` without checking if `.env.example` exists
**Fix:** Check what files exist first: `find . -name "*.env*"`

---

## ✅ The Golden Rules

### Rule 1: Wildcard + Exception Pattern
```gitignore
# Pattern (ignore)
*.env

# Exception (track)
!.env.example
```

### Rule 2: Always Test
```bash
git check-ignore -v .env.example
# No output = ✅ Good (will be tracked)
# Shows pattern = ❌ Bad (is ignored)
```

### Rule 3: Order Matters
```gitignore
# ✅ CORRECT: Pattern first, exception after
*.env
!.env.example

# ❌ WRONG: Exception before pattern
!.env.example
*.env
```

### Rule 4: Add Comments
```gitignore
# Ignore all .env files
*.env

# Exception: .env.example is a template for developers
!.env.example
```

---

## 🔧 Quick Commands

### Test if file is ignored:
```bash
git check-ignore -v <filename>
```

### Find all .env files:
```bash
find . -name "*.env*" -not -path "*/node_modules/*"
```

### Run test script:
```bash
./test-gitignore.sh
```

### Check what will be committed:
```bash
git status
```

---

## 📋 Before Committing Checklist

- [ ] Test `.env.example` is tracked: `git check-ignore -v .env.example` (should return nothing)
- [ ] Test `.env` is ignored: `git check-ignore -v .env` (should show pattern)
- [ ] Run test script: `./test-gitignore.sh`
- [ ] Check `git status` - no sensitive files showing
- [ ] Added comments explaining patterns

---

## 🎯 Common Patterns Cheat Sheet

| What You Want | Pattern | Exception? |
|---------------|---------|------------|
| Ignore all .env | `*.env` | ✅ `!.env.example` |
| Ignore all logs | `*.log` | ✅ `!.log.example` |
| Ignore specific file | `.env` | ❌ No |
| Ignore directory | `node_modules/` | ❌ No |

---

## 💡 Remember

**When you see `*.env`, immediately think: "Do I need `!.env.example`?"**

**Always test before committing!**

