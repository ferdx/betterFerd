module.exports = function(grunt) {
  grunt.initConfig({
    jsdoc : {
        dist : {
            src: ['src/**/*.js'],
            options: {
                destination: 'doc',
                template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                configure : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
            }
        }
    }
  });

  /**
   * loads all the npm tasks
   */
   grunt.loadNpmTasks('grunt-jsdoc');

  /**
   * registers all the npm tasts
   */
  grunt.registerTask('default', 'jsdoc');

};
