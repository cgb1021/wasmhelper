const gulp = require('gulp')
const del = require('del')
const rollup = require('rollup')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const replace = require('gulp-replace')
const fs = require('fs')
// const path = require("path")
// const util = require('gulp-util')
// ===================================
gulp.task('clean', function (cb) {
	return del([
		'./dist/**/*',
		'./es/**/*',
		'./lib/**/*',
		'./temp/**/*'
	], cb)
})
gulp.task('replace', () => {
	return gulp.src('./src/**/*')
    .pipe(replace('/*{{UTILS}}*/', function() {
      const text = fs.readFileSync('./src/utils.js')
      const arr = text.toString().split('/* split_flag */')
      return arr[0]
    }))
    .pipe(replace('/*{{WASM}}*/', function() {
      const text = fs.readFileSync('./src/wasm.js')
      const arr = text.toString().split('/* split_flag */')
      return arr[1]
    }))
		.pipe(gulp.dest('./temp'))
})
gulp.task('rollup', () => {
	return rollup.rollup({
		input: './temp/index.js',
		plugins: []
	}).then(bundle => {
		return bundle.write({
			file: './dist/index.js',
			format: 'umd',
			name: 'wasmhelper'
		})
	})
})
gulp.task('babel', () => {
	return gulp.src('./dist/**/*')
		.pipe(babel({
			presets: [['@babel/preset-env', { 'modules': false }]]
		}))
		.pipe(uglify())
		.pipe(gulp.dest('./dist'))
})
gulp.task('lib', () => {
	return gulp.src('./temp/**/*')
		.pipe(babel({
			presets: [['@babel/preset-env', { 'modules': 'commonjs' }]]
		}))
		.pipe(gulp.dest('./lib'))
})
gulp.task('es', () => {
	return gulp.src('./temp/**/*')
		.pipe(gulp.dest('./es'))
})
gulp.task('build', gulp.series('clean', 'replace', 'rollup', 'babel', gulp.parallel('lib', 'es')))
