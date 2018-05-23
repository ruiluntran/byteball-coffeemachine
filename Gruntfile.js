module.exports = (grunt) => {

  grunt.initConfig({
    clean: ['userInterface/lib/'],
    copy: {
      lib: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'node_modules',
          src: [
            'jquery/dist/jquery.js',
            'qrcodejs/qrcode.js',
            'socket.io-client/dist/socket.io.js'
          ],
          dest: './userInterface/lib/',
          filter: 'isFile'
        }]
      }
    },
    less: {
      development: {
        files: {
          'userInterface/css/result.css': 'userInterface/css/less/style.less'
        }
      }
    },
    watch: {
      less: {
        files: ['userInterface/css/less/*'],
        tasks: ['less']
      },
      lib: {
        files: ['Gruntfile.js'],
        tasks: ['copy']
      }

    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean','copy', 'less', 'watch']);
  grunt.registerTask('prod', ['clean','copy', 'less']);

};