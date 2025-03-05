$branchName = git rev-parse --abbrev-ref HEAD
git checkout main
git pull origin main
git branch -D $branchName