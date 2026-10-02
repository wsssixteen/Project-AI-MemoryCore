#!/usr/bin/env node
// Eval fixture for compile-gate.eval.js — stands in for `mvn` so the offline→online retry and the
// failure labels are tested without a real build. FAKE_MVN_MODE picks the replayed output; the texts
// are the real maven lines from 2026-10-02 (AWAM stag-env PDBB merge).
'use strict';
const offline = process.argv.includes('-o');
const mode = process.env.FAKE_MVN_MODE || 'ok';
const DEP = "[ERROR] Failed to execute goal on project etanah-awam: Could not resolve dependencies for project my.gov.etanah:etanah-awam:war:1.11.1: Cannot access nexus (http://172.16.90.169/nexus/content/groups/public/) in offline mode and the artifact my.gov.etanah:etanah-common:jar:classes:1.7.21-MLK.beta.patch.282299.1 has not been downloaded from it before.";
const TOOL = '[ERROR] Failed to execute goal org.apache.maven.plugins:maven-toolchains-plugin:1.1:toolchain (default) on project etanah-awam: Misconfigured toolchains.: Non-existing JDK home configuration at E:\\Java\\java8';
const COMP = [
  '[ERROR] COMPILATION ERROR :',
  '[ERROR] D:\\Project\\eTanah\\Melaka\\etanah-awam\\src\\main\\java\\my\\gov\\etanah\\awam\\pelupusan\\service\\impl\\PelupusanReportService.java:[791,21] error: method getPlpLaporanBorangPDBB(PraAplikasi) is already defined in class PelupusanReportService',
  '[ERROR] D:\\Project\\eTanah\\Melaka\\etanah-awam\\src\\main\\java\\my\\gov\\etanah\\awam\\pelupusan\\constant\\PelupusanReportConstant.java:[65,28] error: variable LAPORAN_BORANG_PDBB is already defined in class PelupusanReportConstant',
  '[ERROR] D:\\Project\\eTanah\\Melaka\\etanah-awam\\src\\main\\java\\my\\gov\\etanah\\awam\\pelupusan\\constant\\PelupusanConstant.java:[259,31] error: variable URSN_PDBB is already defined in class PelupusanConstant',
  '[ERROR] D:\\Project\\eTanah\\Melaka\\etanah-awam\\src\\main\\java\\my\\gov\\etanah\\awam\\pelupusan\\constant\\PelupusanConstant.java:[259,31] error: variable URSN_PDBB is already defined in class PelupusanConstant',
].join('\n');
if (mode === 'ok') process.exit(0);
if (mode === 'dep-then-ok') { if (offline) { console.log(DEP); process.exit(1); } process.exit(0); }
if (mode === 'dep-both') { console.log(DEP); process.exit(1); }
if (mode === 'toolchain') { console.log(TOOL); process.exit(1); }
if (mode === 'compile') { console.log(COMP); process.exit(1); }
console.log('[ERROR] something unexpected'); process.exit(1);
