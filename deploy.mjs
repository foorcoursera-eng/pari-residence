/* ==========================================================================
   Выкладка сайта на Vercel.
   С 26.09.2026 новый сайт — основной: проект pari-residence (домен pari-residence.uz).
     npm run deploy            → pari-residence (pari-residence.uz, боевой)
     npm run deploy -- redesign → pari-redesign (pari-redesign.vercel.app, проверочный)
   Шаги:
     1. astro build → dist/
     2. в папку .deploy-out/ кладутся dist + deploy/api, deploy/lib (приём заявок
        /api/lead → Telegram), deploy/vercel.json (редиректы старых адресов, заголовки)
        и привязка к выбранному проекту (.vercel/project.json)
     3. vercel deploy --prod
   Откат боевого сайта: npx vercel rollback (в папке .deploy-out) или «Instant Rollback» в Vercel.
   Токен бота и чат — только в настройках проекта на Vercel: TG_BOT_TOKEN, TG_CHAT_ID.
   ========================================================================== */
import { cpSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ORG = 'team_peBhgONrylKUaeJNzNPKMYEc';
const PROJECTS = {
  main: { projectId: 'prj_51JNt5vtSlL5vFeBFzBF6pfGVPYU', projectName: 'pari-residence' },
  redesign: { projectId: 'prj_f8ngDcm8Njd737kixww0UvrgMbbF', projectName: 'pari-redesign' },
};
const target = PROJECTS[process.argv[2] || 'main'];
if (!target) throw new Error('Цель: main или redesign');

const OUT = '.deploy-out';
execSync('npx astro build', { stdio: 'inherit' });
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
cpSync('dist', OUT, { recursive: true });
for (const x of ['api', 'lib', 'vercel.json']) {
  if (existsSync(`deploy/${x}`)) cpSync(`deploy/${x}`, `${OUT}/${x}`, { recursive: true });
}
mkdirSync(`${OUT}/.vercel`);
writeFileSync(`${OUT}/.vercel/project.json`, JSON.stringify({ ...target, orgId: ORG }));
console.log(`→ ${target.projectName}`);
execSync('npx --yes vercel@latest deploy --prod --yes', { cwd: OUT, stdio: 'inherit' });
