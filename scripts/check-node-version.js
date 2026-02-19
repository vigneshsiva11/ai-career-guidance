const major = Number(process.versions.node.split(".")[0] || 0);

const supported = major === 20 || major === 22;

if (!supported) {
  console.error(
    `\n[dev] Unsupported Node.js version: v${process.versions.node}\n` +
      "[dev] Use Node.js 20.x or 22.x (LTS) for stable Next.js dev server behavior.\n" +
      "[dev] Current symptoms on unsupported versions include _next/static 500/404, missing CSS, and chunk failures.\n"
  );
  process.exit(1);
}
