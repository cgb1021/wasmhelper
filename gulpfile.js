const gulp = require('gulp');
const del = require('del');
const rollup = require('rollup');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const fs = require('fs');
const UglifyJS = require('uglify-js');
// const path = require("path")
// const util = require('gulp-util')
// ===================================
gulp.task('clean', function (cb) {
  return del([
    './dist/**/*',
    './es/**/*',
    './lib/**/*',
    './temp/**/*'
  ], cb);
});
gulp.task('replace', () => {
  return gulp.src('./src/**/*')
    .pipe(replace(/\/\*\{\{(UTILS|WASM|LOAD|INDEX)\}\}\*\//g, function(match, p1) {
      const replaceIndex = {
        UTILS: 0,
        WASM: 1,
        LOAD: 1,
        INDEX: 1
      };
      const text = fs.readFileSync(`./src/${p1.replace(/_.+$/g, '').toLowerCase()}.js`);
      const arr = text.toString().split('/* gulp_split */');
      let code = '';
      if (p1 === 'UTILS') {
        code = arr[replaceIndex[p1]].replace('export default', 'var utils =');
      } else if (p1 === 'INDEX') {
        return arr[replaceIndex[p1]].trim();
      } else {
        code = arr[replaceIndex[p1]];
      }
      return UglifyJS.minify(code.trim(), {
        keep_fnames: true
      }).code;
    }))
    .pipe(gulp.dest('./temp'));
});
gulp.task('rollup', () => {
  return rollup.rollup({
    input: './temp/index.js',
    plugins: []
  }).then(bundle => {
    return bundle.write({
      file: './dist/index.js',
      format: 'umd',
      name: 'wasmhelper'
    });
  });
});
gulp.task('babel', () => {
  return gulp.src('./dist/**/*')
    .pipe(babel({
      presets: [['@babel/preset-env', { 'modules': false }]]
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
});
gulp.task('lib', () => {
  return gulp.src('./temp/**/*')
    .pipe(babel({
      presets: [['@babel/preset-env', { 'modules': 'commonjs' }]]
    }))
    .pipe(gulp.dest('./lib'));
});
gulp.task('es', () => {
  return gulp.src('./temp/**/*')
    .pipe(gulp.dest('./es'));
});
gulp.task('copy', () => {
  return gulp.src('./dist/index.js')
    .pipe(gulp.dest('./test/data'));
});
gulp.task('build', gulp.series('clean', 'replace', 'rollup', 'babel', gulp.parallel('lib', 'es'), 'copy'));
