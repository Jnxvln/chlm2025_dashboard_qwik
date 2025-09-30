// vite.config.ts
import { defineConfig } from "file:///C:/Justin/code/CHLM/chlm2025_dashboard_qwik_project/chlm2025_dashboard_qwik/node_modules/.pnpm/vite@5.3.5_@types+node@20.14.11_lightningcss@1.30.1/node_modules/vite/dist/node/index.js";
import { qwikVite } from "file:///C:/Justin/code/CHLM/chlm2025_dashboard_qwik_project/chlm2025_dashboard_qwik/node_modules/.pnpm/@builder.io+qwik@1.14.1_vit_224931fc5b23078274972ca564b66277/node_modules/@builder.io/qwik/dist/optimizer.mjs";
import { qwikCity } from "file:///C:/Justin/code/CHLM/chlm2025_dashboard_qwik_project/chlm2025_dashboard_qwik/node_modules/.pnpm/@builder.io+qwik-city@1.14._6c5a83adef710cb3a3b1e0eb4053bbe4/node_modules/@builder.io/qwik-city/lib/vite/index.mjs";
import tsconfigPaths from "file:///C:/Justin/code/CHLM/chlm2025_dashboard_qwik_project/chlm2025_dashboard_qwik/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_t_cfe82521609ef13f7061c233678dc1ad/node_modules/vite-tsconfig-paths/dist/index.mjs";

// package.json
var package_default = {
  name: "chlm2025-dashboard-qwik",
  description: "Dashboard for managing internal resources at CHLM",
  engines: {
    node: "^18.17.0 || ^20.3.0 || >=21.0.0"
  },
  "engines-annotation": "Mostly required by sharp which needs a Node-API v9 compatible runtime",
  private: true,
  type: "module",
  scripts: {
    build: "qwik build && npm run build.preview && npm run copy-server",
    "build.client": "vite build",
    "build.server": "vite build --ssr src/entry.ssr.tsx --outDir dist/server",
    "build.preview": "vite build --ssr src/entry.preview.tsx --outDir dist/server",
    "build.types": "tsc --incremental --noEmit",
    "copy-server": "mkdir -p server && cp -r dist/server/* server/",
    deploy: `echo 'Run "npm run qwik add" to install a server adapter'`,
    dev: "vite --mode ssr",
    "dev.debug": "node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force",
    fmt: "prettier --write .",
    "fmt.check": "prettier --check .",
    lint: 'eslint "src/**/*.ts*"',
    postinstall: "prisma generate",
    preview: "vite preview --open",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    start: "npm run prisma:migrate:prod && node server.js",
    "start:dev": "vite --open --mode ssr",
    qwik: "qwik"
  },
  devDependencies: {
    "@builder.io/qwik": "^1.14.1",
    "@builder.io/qwik-city": "^1.14.1",
    "@eslint/js": "latest",
    "@prisma/client": "6.12.0",
    "@types/node": "20.14.11",
    eslint: "9.25.1",
    "eslint-plugin-qwik": "^1.14.1",
    globals: "16.0.0",
    prettier: "3.3.3",
    prisma: "6.12.0",
    typescript: "5.4.5",
    "typescript-eslint": "8.26.1",
    undici: "*",
    vite: "5.3.5",
    "vite-tsconfig-paths": "^4.2.1"
  },
  dependencies: {
    "@tailwindcss/vite": "^4.1.10",
    "@types/express": "^5.0.3",
    express: "^5.1.0",
    tailwindcss: "^4.1.10",
    zod: "^3.23.8"
  },
  packageManager: "pnpm@10.12.1+sha512.f0dda8580f0ee9481c5c79a1d927b9164f2c478e90992ad268bbb2465a736984391d6333d2c327913578b2804af33474ca554ba29c04a8b13060a717675ae3ac"
};

// vite.config.ts
import tailwindcss from "file:///C:/Justin/code/CHLM/chlm2025_dashboard_qwik_project/chlm2025_dashboard_qwik/node_modules/.pnpm/@tailwindcss+vite@4.1.10_vi_8db628a4ebe6fb6795f4982bee52d7ff/node_modules/@tailwindcss/vite/dist/index.mjs";
var { dependencies = {}, devDependencies = {} } = package_default;
errorOnDuplicatesPkgDeps(devDependencies, dependencies);
var vite_config_default = defineConfig(({ command, mode }) => {
  return {
    plugins: [tailwindcss(), qwikCity(), qwikVite(), tsconfigPaths()],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      // For example ['better-sqlite3'] if you use that in server functions.
      exclude: []
    },
    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // ssr:
    //   command === "build" && mode === "production"
    //     ? {
    //         // All dev dependencies should be bundled in the server build
    //         noExternal: Object.keys(devDependencies),
    //         // Anything marked as a dependency will not be bundled
    //         // These should only be production binary deps (including deps of deps), CLI deps, and their module graph
    //         // If a dep-of-dep needs to be external, add it here
    //         // For example, if something uses `bcrypt` but you don't have it as a dep, you can write
    //         // external: [...Object.keys(dependencies), 'bcrypt']
    //         external: Object.keys(dependencies),
    //       }
    //     : undefined,
    server: {
      port: 3e3,
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0"
      }
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600"
      }
    }
  };
});
function errorOnDuplicatesPkgDeps(devDependencies2, dependencies2) {
  let msg = "";
  const duplicateDeps = Object.keys(devDependencies2).filter(
    (dep) => dependencies2[dep]
  );
  const qwikPkg = Object.keys(dependencies2).filter(
    (value) => /qwik/i.test(value)
  );
  msg = `Move qwik packages ${qwikPkg.join(", ")} to devDependencies`;
  if (qwikPkg.length > 0) {
    throw new Error(msg);
  }
  msg = `
    Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies".
    Please move the duplicated dependencies to "devDependencies" only and remove it from "dependencies"
  `;
  if (duplicateDeps.length > 0) {
    throw new Error(msg);
  }
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcSnVzdGluXFxcXGNvZGVcXFxcQ0hMTVxcXFxjaGxtMjAyNV9kYXNoYm9hcmRfcXdpa19wcm9qZWN0XFxcXGNobG0yMDI1X2Rhc2hib2FyZF9xd2lrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxKdXN0aW5cXFxcY29kZVxcXFxDSExNXFxcXGNobG0yMDI1X2Rhc2hib2FyZF9xd2lrX3Byb2plY3RcXFxcY2hsbTIwMjVfZGFzaGJvYXJkX3F3aWtcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L0p1c3Rpbi9jb2RlL0NITE0vY2hsbTIwMjVfZGFzaGJvYXJkX3F3aWtfcHJvamVjdC9jaGxtMjAyNV9kYXNoYm9hcmRfcXdpay92aXRlLmNvbmZpZy50c1wiOy8qKlxyXG4gKiBUaGlzIGlzIHRoZSBiYXNlIGNvbmZpZyBmb3Igdml0ZS5cclxuICogV2hlbiBidWlsZGluZywgdGhlIGFkYXB0ZXIgY29uZmlnIGlzIHVzZWQgd2hpY2ggbG9hZHMgdGhpcyBmaWxlIGFuZCBleHRlbmRzIGl0LlxyXG4gKi9cclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFVzZXJDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgeyBxd2lrVml0ZSB9IGZyb20gXCJAYnVpbGRlci5pby9xd2lrL29wdGltaXplclwiO1xyXG5pbXBvcnQgeyBxd2lrQ2l0eSB9IGZyb20gXCJAYnVpbGRlci5pby9xd2lrLWNpdHkvdml0ZVwiO1xyXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xyXG5pbXBvcnQgcGtnIGZyb20gXCIuL3BhY2thZ2UuanNvblwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcblxyXG50eXBlIFBrZ0RlcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XHJcbmNvbnN0IHsgZGVwZW5kZW5jaWVzID0ge30sIGRldkRlcGVuZGVuY2llcyA9IHt9IH0gPSBwa2cgYXMgYW55IGFzIHtcclxuICBkZXBlbmRlbmNpZXM6IFBrZ0RlcDtcclxuICBkZXZEZXBlbmRlbmNpZXM6IFBrZ0RlcDtcclxuICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xyXG59O1xyXG5lcnJvck9uRHVwbGljYXRlc1BrZ0RlcHMoZGV2RGVwZW5kZW5jaWVzLCBkZXBlbmRlbmNpZXMpO1xyXG5cclxuLyoqXHJcbiAqIE5vdGUgdGhhdCBWaXRlIG5vcm1hbGx5IHN0YXJ0cyBmcm9tIGBpbmRleC5odG1sYCBidXQgdGhlIHF3aWtDaXR5IHBsdWdpbiBtYWtlcyBzdGFydCBhdCBgc3JjL2VudHJ5LnNzci50c3hgIGluc3RlYWQuXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCwgbW9kZSB9KTogVXNlckNvbmZpZyA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFt0YWlsd2luZGNzcygpLCBxd2lrQ2l0eSgpLCBxd2lrVml0ZSgpLCB0c2NvbmZpZ1BhdGhzKCldLFxyXG4gICAgLy8gVGhpcyB0ZWxscyBWaXRlIHdoaWNoIGRlcGVuZGVuY2llcyB0byBwcmUtYnVpbGQgaW4gZGV2IG1vZGUuXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgLy8gUHV0IHByb2JsZW1hdGljIGRlcHMgdGhhdCBicmVhayBidW5kbGluZyBoZXJlLCBtb3N0bHkgdGhvc2Ugd2l0aCBiaW5hcmllcy5cclxuICAgICAgLy8gRm9yIGV4YW1wbGUgWydiZXR0ZXItc3FsaXRlMyddIGlmIHlvdSB1c2UgdGhhdCBpbiBzZXJ2ZXIgZnVuY3Rpb25zLlxyXG4gICAgICBleGNsdWRlOiBbXSxcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGlzIGFuIGFkdmFuY2VkIHNldHRpbmcuIEl0IGltcHJvdmVzIHRoZSBidW5kbGluZyBvZiB5b3VyIHNlcnZlciBjb2RlLiBUbyB1c2UgaXQsIG1ha2Ugc3VyZSB5b3UgdW5kZXJzdGFuZCB3aGVuIHlvdXIgY29uc3VtZWQgcGFja2FnZXMgYXJlIGRlcGVuZGVuY2llcyBvciBkZXYgZGVwZW5kZW5jaWVzLiAob3RoZXJ3aXNlIHRoaW5ncyB3aWxsIGJyZWFrIGluIHByb2R1Y3Rpb24pXHJcbiAgICAgKi9cclxuICAgIC8vIHNzcjpcclxuICAgIC8vICAgY29tbWFuZCA9PT0gXCJidWlsZFwiICYmIG1vZGUgPT09IFwicHJvZHVjdGlvblwiXHJcbiAgICAvLyAgICAgPyB7XHJcbiAgICAvLyAgICAgICAgIC8vIEFsbCBkZXYgZGVwZW5kZW5jaWVzIHNob3VsZCBiZSBidW5kbGVkIGluIHRoZSBzZXJ2ZXIgYnVpbGRcclxuICAgIC8vICAgICAgICAgbm9FeHRlcm5hbDogT2JqZWN0LmtleXMoZGV2RGVwZW5kZW5jaWVzKSxcclxuICAgIC8vICAgICAgICAgLy8gQW55dGhpbmcgbWFya2VkIGFzIGEgZGVwZW5kZW5jeSB3aWxsIG5vdCBiZSBidW5kbGVkXHJcbiAgICAvLyAgICAgICAgIC8vIFRoZXNlIHNob3VsZCBvbmx5IGJlIHByb2R1Y3Rpb24gYmluYXJ5IGRlcHMgKGluY2x1ZGluZyBkZXBzIG9mIGRlcHMpLCBDTEkgZGVwcywgYW5kIHRoZWlyIG1vZHVsZSBncmFwaFxyXG4gICAgLy8gICAgICAgICAvLyBJZiBhIGRlcC1vZi1kZXAgbmVlZHMgdG8gYmUgZXh0ZXJuYWwsIGFkZCBpdCBoZXJlXHJcbiAgICAvLyAgICAgICAgIC8vIEZvciBleGFtcGxlLCBpZiBzb21ldGhpbmcgdXNlcyBgYmNyeXB0YCBidXQgeW91IGRvbid0IGhhdmUgaXQgYXMgYSBkZXAsIHlvdSBjYW4gd3JpdGVcclxuICAgIC8vICAgICAgICAgLy8gZXh0ZXJuYWw6IFsuLi5PYmplY3Qua2V5cyhkZXBlbmRlbmNpZXMpLCAnYmNyeXB0J11cclxuICAgIC8vICAgICAgICAgZXh0ZXJuYWw6IE9iamVjdC5rZXlzKGRlcGVuZGVuY2llcyksXHJcbiAgICAvLyAgICAgICB9XHJcbiAgICAvLyAgICAgOiB1bmRlZmluZWQsXHJcblxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAvLyBEb24ndCBjYWNoZSB0aGUgc2VydmVyIHJlc3BvbnNlIGluIGRldiBtb2RlXHJcbiAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTBcIixcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBwcmV2aWV3OiB7XHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAvLyBEbyBjYWNoZSB0aGUgc2VydmVyIHJlc3BvbnNlIGluIHByZXZpZXcgKG5vbi1hZGFwdGVyIHByb2R1Y3Rpb24gYnVpbGQpXHJcbiAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTYwMFwiLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuXHJcbi8vICoqKiB1dGlscyAqKipcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBpZGVudGlmeSBkdXBsaWNhdGUgZGVwZW5kZW5jaWVzIGFuZCB0aHJvdyBhbiBlcnJvclxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGV2RGVwZW5kZW5jaWVzIC0gTGlzdCBvZiBkZXZlbG9wbWVudCBkZXBlbmRlbmNpZXNcclxuICogQHBhcmFtIHtPYmplY3R9IGRlcGVuZGVuY2llcyAtIExpc3Qgb2YgcHJvZHVjdGlvbiBkZXBlbmRlbmNpZXNcclxuICovXHJcbmZ1bmN0aW9uIGVycm9yT25EdXBsaWNhdGVzUGtnRGVwcyhcclxuICBkZXZEZXBlbmRlbmNpZXM6IFBrZ0RlcCxcclxuICBkZXBlbmRlbmNpZXM6IFBrZ0RlcCxcclxuKSB7XHJcbiAgbGV0IG1zZyA9IFwiXCI7XHJcbiAgLy8gQ3JlYXRlIGFuIGFycmF5ICdkdXBsaWNhdGVEZXBzJyBieSBmaWx0ZXJpbmcgZGV2RGVwZW5kZW5jaWVzLlxyXG4gIC8vIElmIGEgZGVwZW5kZW5jeSBhbHNvIGV4aXN0cyBpbiBkZXBlbmRlbmNpZXMsIGl0IGlzIGNvbnNpZGVyZWQgYSBkdXBsaWNhdGUuXHJcbiAgY29uc3QgZHVwbGljYXRlRGVwcyA9IE9iamVjdC5rZXlzKGRldkRlcGVuZGVuY2llcykuZmlsdGVyKFxyXG4gICAgKGRlcCkgPT4gZGVwZW5kZW5jaWVzW2RlcF0sXHJcbiAgKTtcclxuXHJcbiAgLy8gaW5jbHVkZSBhbnkga25vd24gcXdpayBwYWNrYWdlc1xyXG4gIGNvbnN0IHF3aWtQa2cgPSBPYmplY3Qua2V5cyhkZXBlbmRlbmNpZXMpLmZpbHRlcigodmFsdWUpID0+XHJcbiAgICAvcXdpay9pLnRlc3QodmFsdWUpLFxyXG4gICk7XHJcblxyXG4gIC8vIGFueSBlcnJvcnMgZm9yIG1pc3NpbmcgXCJxd2lrLWNpdHktcGxhblwiXHJcbiAgLy8gW1BMVUdJTl9FUlJPUl06IEludmFsaWQgbW9kdWxlIFwiQHF3aWstY2l0eS1wbGFuXCIgaXMgbm90IGEgdmFsaWQgcGFja2FnZVxyXG4gIG1zZyA9IGBNb3ZlIHF3aWsgcGFja2FnZXMgJHtxd2lrUGtnLmpvaW4oXCIsIFwiKX0gdG8gZGV2RGVwZW5kZW5jaWVzYDtcclxuXHJcbiAgaWYgKHF3aWtQa2cubGVuZ3RoID4gMCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XHJcbiAgfVxyXG5cclxuICAvLyBGb3JtYXQgdGhlIGVycm9yIG1lc3NhZ2Ugd2l0aCB0aGUgZHVwbGljYXRlcyBsaXN0LlxyXG4gIC8vIFRoZSBgam9pbmAgZnVuY3Rpb24gaXMgdXNlZCB0byByZXByZXNlbnQgdGhlIGVsZW1lbnRzIG9mIHRoZSAnZHVwbGljYXRlRGVwcycgYXJyYXkgYXMgYSBjb21tYS1zZXBhcmF0ZWQgc3RyaW5nLlxyXG4gIG1zZyA9IGBcclxuICAgIFdhcm5pbmc6IFRoZSBkZXBlbmRlbmN5IFwiJHtkdXBsaWNhdGVEZXBzLmpvaW4oXCIsIFwiKX1cIiBpcyBsaXN0ZWQgaW4gYm90aCBcImRldkRlcGVuZGVuY2llc1wiIGFuZCBcImRlcGVuZGVuY2llc1wiLlxyXG4gICAgUGxlYXNlIG1vdmUgdGhlIGR1cGxpY2F0ZWQgZGVwZW5kZW5jaWVzIHRvIFwiZGV2RGVwZW5kZW5jaWVzXCIgb25seSBhbmQgcmVtb3ZlIGl0IGZyb20gXCJkZXBlbmRlbmNpZXNcIlxyXG4gIGA7XHJcblxyXG4gIC8vIFRocm93IGFuIGVycm9yIHdpdGggdGhlIGNvbnN0cnVjdGVkIG1lc3NhZ2UuXHJcbiAgaWYgKGR1cGxpY2F0ZURlcHMubGVuZ3RoID4gMCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XHJcbiAgfVxyXG59XHJcbiIsICJ7XHJcbiAgXCJuYW1lXCI6IFwiY2hsbTIwMjUtZGFzaGJvYXJkLXF3aWtcIixcclxuICBcImRlc2NyaXB0aW9uXCI6IFwiRGFzaGJvYXJkIGZvciBtYW5hZ2luZyBpbnRlcm5hbCByZXNvdXJjZXMgYXQgQ0hMTVwiLFxyXG4gIFwiZW5naW5lc1wiOiB7XHJcbiAgICBcIm5vZGVcIjogXCJeMTguMTcuMCB8fCBeMjAuMy4wIHx8ID49MjEuMC4wXCJcclxuICB9LFxyXG4gIFwiZW5naW5lcy1hbm5vdGF0aW9uXCI6IFwiTW9zdGx5IHJlcXVpcmVkIGJ5IHNoYXJwIHdoaWNoIG5lZWRzIGEgTm9kZS1BUEkgdjkgY29tcGF0aWJsZSBydW50aW1lXCIsXHJcbiAgXCJwcml2YXRlXCI6IHRydWUsXHJcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXHJcbiAgXCJzY3JpcHRzXCI6IHtcclxuICAgIFwiYnVpbGRcIjogXCJxd2lrIGJ1aWxkICYmIG5wbSBydW4gYnVpbGQucHJldmlldyAmJiBucG0gcnVuIGNvcHktc2VydmVyXCIsXHJcbiAgICBcImJ1aWxkLmNsaWVudFwiOiBcInZpdGUgYnVpbGRcIixcclxuICAgIFwiYnVpbGQuc2VydmVyXCI6IFwidml0ZSBidWlsZCAtLXNzciBzcmMvZW50cnkuc3NyLnRzeCAtLW91dERpciBkaXN0L3NlcnZlclwiLFxyXG4gICAgXCJidWlsZC5wcmV2aWV3XCI6IFwidml0ZSBidWlsZCAtLXNzciBzcmMvZW50cnkucHJldmlldy50c3ggLS1vdXREaXIgZGlzdC9zZXJ2ZXJcIixcclxuICAgIFwiYnVpbGQudHlwZXNcIjogXCJ0c2MgLS1pbmNyZW1lbnRhbCAtLW5vRW1pdFwiLFxyXG4gICAgXCJjb3B5LXNlcnZlclwiOiBcIm1rZGlyIC1wIHNlcnZlciAmJiBjcCAtciBkaXN0L3NlcnZlci8qIHNlcnZlci9cIixcclxuICAgIFwiZGVwbG95XCI6IFwiZWNobyAnUnVuIFxcXCJucG0gcnVuIHF3aWsgYWRkXFxcIiB0byBpbnN0YWxsIGEgc2VydmVyIGFkYXB0ZXInXCIsXHJcbiAgICBcImRldlwiOiBcInZpdGUgLS1tb2RlIHNzclwiLFxyXG4gICAgXCJkZXYuZGVidWdcIjogXCJub2RlIC0taW5zcGVjdC1icmsgLi9ub2RlX21vZHVsZXMvdml0ZS9iaW4vdml0ZS5qcyAtLW1vZGUgc3NyIC0tZm9yY2VcIixcclxuICAgIFwiZm10XCI6IFwicHJldHRpZXIgLS13cml0ZSAuXCIsXHJcbiAgICBcImZtdC5jaGVja1wiOiBcInByZXR0aWVyIC0tY2hlY2sgLlwiLFxyXG4gICAgXCJsaW50XCI6IFwiZXNsaW50IFxcXCJzcmMvKiovKi50cypcXFwiXCIsXHJcbiAgICBcInBvc3RpbnN0YWxsXCI6IFwicHJpc21hIGdlbmVyYXRlXCIsXHJcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXcgLS1vcGVuXCIsXHJcbiAgICBcInByaXNtYTpnZW5lcmF0ZVwiOiBcInByaXNtYSBnZW5lcmF0ZVwiLFxyXG4gICAgXCJwcmlzbWE6bWlncmF0ZVwiOiBcInByaXNtYSBtaWdyYXRlIGRldlwiLFxyXG4gICAgXCJwcmlzbWE6bWlncmF0ZTpwcm9kXCI6IFwicHJpc21hIG1pZ3JhdGUgZGVwbG95XCIsXHJcbiAgICBcInN0YXJ0XCI6IFwibnBtIHJ1biBwcmlzbWE6bWlncmF0ZTpwcm9kICYmIG5vZGUgc2VydmVyLmpzXCIsXHJcbiAgICBcInN0YXJ0OmRldlwiOiBcInZpdGUgLS1vcGVuIC0tbW9kZSBzc3JcIixcclxuICAgIFwicXdpa1wiOiBcInF3aWtcIlxyXG4gIH0sXHJcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xyXG4gICAgXCJAYnVpbGRlci5pby9xd2lrXCI6IFwiXjEuMTQuMVwiLFxyXG4gICAgXCJAYnVpbGRlci5pby9xd2lrLWNpdHlcIjogXCJeMS4xNC4xXCIsXHJcbiAgICBcIkBlc2xpbnQvanNcIjogXCJsYXRlc3RcIixcclxuICAgIFwiQHByaXNtYS9jbGllbnRcIjogXCI2LjEyLjBcIixcclxuICAgIFwiQHR5cGVzL25vZGVcIjogXCIyMC4xNC4xMVwiLFxyXG4gICAgXCJlc2xpbnRcIjogXCI5LjI1LjFcIixcclxuICAgIFwiZXNsaW50LXBsdWdpbi1xd2lrXCI6IFwiXjEuMTQuMVwiLFxyXG4gICAgXCJnbG9iYWxzXCI6IFwiMTYuMC4wXCIsXHJcbiAgICBcInByZXR0aWVyXCI6IFwiMy4zLjNcIixcclxuICAgIFwicHJpc21hXCI6IFwiNi4xMi4wXCIsXHJcbiAgICBcInR5cGVzY3JpcHRcIjogXCI1LjQuNVwiLFxyXG4gICAgXCJ0eXBlc2NyaXB0LWVzbGludFwiOiBcIjguMjYuMVwiLFxyXG4gICAgXCJ1bmRpY2lcIjogXCIqXCIsXHJcbiAgICBcInZpdGVcIjogXCI1LjMuNVwiLFxyXG4gICAgXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI6IFwiXjQuMi4xXCJcclxuICB9LFxyXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjogXCJeNC4xLjEwXCIsXHJcbiAgICBcIkB0eXBlcy9leHByZXNzXCI6IFwiXjUuMC4zXCIsXHJcbiAgICBcImV4cHJlc3NcIjogXCJeNS4xLjBcIixcclxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJeNC4xLjEwXCIsXHJcbiAgICBcInpvZFwiOiBcIl4zLjIzLjhcIlxyXG4gIH0sXHJcbiAgXCJwYWNrYWdlTWFuYWdlclwiOiBcInBucG1AMTAuMTIuMStzaGE1MTIuZjBkZGE4NTgwZjBlZTk0ODFjNWM3OWExZDkyN2I5MTY0ZjJjNDc4ZTkwOTkyYWQyNjhiYmIyNDY1YTczNjk4NDM5MWQ2MzMzZDJjMzI3OTEzNTc4YjI4MDRhZjMzNDc0Y2E1NTRiYTI5YzA0YThiMTMwNjBhNzE3Njc1YWUzYWNcIlxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFJQSxTQUFTLG9CQUFxQztBQUM5QyxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGdCQUFnQjtBQUN6QixPQUFPLG1CQUFtQjs7O0FDUDFCO0FBQUEsRUFDRSxNQUFRO0FBQUEsRUFDUixhQUFlO0FBQUEsRUFDZixTQUFXO0FBQUEsSUFDVCxNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0Esc0JBQXNCO0FBQUEsRUFDdEIsU0FBVztBQUFBLEVBQ1gsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLElBQ1QsT0FBUztBQUFBLElBQ1QsZ0JBQWdCO0FBQUEsSUFDaEIsZ0JBQWdCO0FBQUEsSUFDaEIsaUJBQWlCO0FBQUEsSUFDakIsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLElBQ2YsUUFBVTtBQUFBLElBQ1YsS0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLElBQ2IsS0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLElBQ2IsTUFBUTtBQUFBLElBQ1IsYUFBZTtBQUFBLElBQ2YsU0FBVztBQUFBLElBQ1gsbUJBQW1CO0FBQUEsSUFDbkIsa0JBQWtCO0FBQUEsSUFDbEIsdUJBQXVCO0FBQUEsSUFDdkIsT0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGlCQUFtQjtBQUFBLElBQ2pCLG9CQUFvQjtBQUFBLElBQ3BCLHlCQUF5QjtBQUFBLElBQ3pCLGNBQWM7QUFBQSxJQUNkLGtCQUFrQjtBQUFBLElBQ2xCLGVBQWU7QUFBQSxJQUNmLFFBQVU7QUFBQSxJQUNWLHNCQUFzQjtBQUFBLElBQ3RCLFNBQVc7QUFBQSxJQUNYLFVBQVk7QUFBQSxJQUNaLFFBQVU7QUFBQSxJQUNWLFlBQWM7QUFBQSxJQUNkLHFCQUFxQjtBQUFBLElBQ3JCLFFBQVU7QUFBQSxJQUNWLE1BQVE7QUFBQSxJQUNSLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQUEsRUFDQSxjQUFnQjtBQUFBLElBQ2QscUJBQXFCO0FBQUEsSUFDckIsa0JBQWtCO0FBQUEsSUFDbEIsU0FBVztBQUFBLElBQ1gsYUFBZTtBQUFBLElBQ2YsS0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGdCQUFrQjtBQUNwQjs7O0FEL0NBLE9BQU8saUJBQWlCO0FBR3hCLElBQU0sRUFBRSxlQUFlLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxFQUFFLElBQUk7QUFLcEQseUJBQXlCLGlCQUFpQixZQUFZO0FBS3RELElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsU0FBUyxLQUFLLE1BQWtCO0FBQzdELFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxZQUFZLEdBQUcsU0FBUyxHQUFHLFNBQVMsR0FBRyxjQUFjLENBQUM7QUFBQTtBQUFBLElBRWhFLGNBQWM7QUFBQTtBQUFBO0FBQUEsTUFHWixTQUFTLENBQUM7QUFBQSxJQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQW1CQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUE7QUFBQSxRQUVQLGlCQUFpQjtBQUFBLE1BQ25CO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBO0FBQUEsUUFFUCxpQkFBaUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQztBQVNELFNBQVMseUJBQ1BBLGtCQUNBQyxlQUNBO0FBQ0EsTUFBSSxNQUFNO0FBR1YsUUFBTSxnQkFBZ0IsT0FBTyxLQUFLRCxnQkFBZSxFQUFFO0FBQUEsSUFDakQsQ0FBQyxRQUFRQyxjQUFhLEdBQUc7QUFBQSxFQUMzQjtBQUdBLFFBQU0sVUFBVSxPQUFPLEtBQUtBLGFBQVksRUFBRTtBQUFBLElBQU8sQ0FBQyxVQUNoRCxRQUFRLEtBQUssS0FBSztBQUFBLEVBQ3BCO0FBSUEsUUFBTSxzQkFBc0IsUUFBUSxLQUFLLElBQUksQ0FBQztBQUU5QyxNQUFJLFFBQVEsU0FBUyxHQUFHO0FBQ3RCLFVBQU0sSUFBSSxNQUFNLEdBQUc7QUFBQSxFQUNyQjtBQUlBLFFBQU07QUFBQSwrQkFDdUIsY0FBYyxLQUFLLElBQUksQ0FBQztBQUFBO0FBQUE7QUFLckQsTUFBSSxjQUFjLFNBQVMsR0FBRztBQUM1QixVQUFNLElBQUksTUFBTSxHQUFHO0FBQUEsRUFDckI7QUFDRjsiLAogICJuYW1lcyI6IFsiZGV2RGVwZW5kZW5jaWVzIiwgImRlcGVuZGVuY2llcyJdCn0K
