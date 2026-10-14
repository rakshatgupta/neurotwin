# Publish on GitHub Pages

The GitHub Actions workflow is already included at `.github/workflows/deploy.yml`. It builds the static Next.js export and deploys `out/`. Internal links use Next.js Link and the build takes its repository prefix from GitHub Pages, so the brain link works at `/neurotwin/home/` as well as on a root domain.

1. Sign into GitHub and create a new **public**, empty repository named `neurotwin`. Leave the README, license, and gitignore checkboxes unchecked.
2. In PowerShell, run these commands, replacing `YOUR-USERNAME`:

```powershell
cd 'C:\Users\raksh\OneDrive\Documents\Playground\neurotwin'
git add .
git commit -m "Prepare NeuroTwin for GitHub Pages"
git branch -M main
git remote add github https://github.com/YOUR-USERNAME/neurotwin.git
git push -u github main
```

The current project already has Git history. If there are no uncommitted changes, skip the commit command. If the `github` remote already exists, use `git remote set-url github https://github.com/YOUR-USERNAME/neurotwin.git` instead of `remote add`. Sign in through Git's browser prompt if requested.

3. In the repository, open **Settings > Pages > Build and deployment** and set **Source** to **GitHub Actions**.
4. Open **Actions > Deploy NeuroTwin to GitHub Pages > Run workflow**, choose `main`, and click **Run workflow**. The initial push may run before Pages is enabled; the manual run starts a fresh deployment after setup.
5. Wait for both jobs to turn green. Your public website is at `https://YOUR-USERNAME.github.io/neurotwin/`. The successful deployment also links to its actual URL.

Every later push to `main` republishes the site. No Vercel account or API key is needed for this static prototype. GitHub Pages serves the frontend; check-ins remain in each visitor's browser. A future AI backend needs separate hosting.

## Optional local check

```powershell
npm ci
npm run dev
```

Open the localhost URL shown in the terminal.

## Official references

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
