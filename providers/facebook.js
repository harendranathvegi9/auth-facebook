/**
* @ngdoc service
* @name ng2AuthFacebook.providers:OAuth2FacebookProvider
* @description
* Provider configuration docs.
*/

/**
* @ngdoc service
* @name ng2AuthFacebook.services:OAuth2Facebook
* @description
* Service consumption docs.
*/

angular
.module('ng2-auth-facebook')
.provider('OAuth2Facebook', function () {
  /**
   * @name options
   * @type {Object}
   * @propertyOf ng2AuthFacebook.providers:OAuth2FacebookProvider
   */
  var opts = {
    cliend_id: '',
    scope: 'email',
    redirect_uri: encodeURIComponent(window.location.origin+'/auth/facebook/callback'),
    response_type: 'token',
    state: ''+Math.random()*0.1e19+Math.random()*0.5e19+Math.random()*0.9e19
  };

  var baseUrl = 'https://www.facebook.com/dialog/oauth';

  var session;
  /**
   * @description
   * The actual service.
   */
  return {

    /**
     * Inject services used within your service here
     */
    $get: ['$rootScope', '$window', '$q', '$http', '$timeout'
    , function ($rootScope, $window, $q, $http, $timeout){

      var buildUrl = function () {
        return baseUrl+'?client_id='+opts.client_id
          +'&app_id='+opts.client_id
          +'&response_type='+opts.response_type
          +'&state='+opts.state
          +'&scope='+opts.scope
          +'&redirect_uri='+opts.redirect_uri;
      }

      $rootScope.$on('ng2auth:oauth2::callback', function (event, data) {
        if(data.strategy !== 'facebook') return;

        session = data.state === opts.state ? data : undefined;

        $timeout(function () {
          if(!!session) {
            $rootScope.$broadcast('ng2auth:oauth2::success', {
              strategy: 'facebook',
              session: session
            });
          } else {
            $rootScope.$broadcast('ng2auth:oauth2::failure', {
              strategy: 'facebook',
              error: !!session?null:'Original and Returned State\ss don\'t match.',
            });
          }
        },0);
      });

      $rootScope.$on('ng2auth:oauth2::failure', function (event, data) {
        if(data.strategy==='facebook') {
          session = false;
        }
      })

      $rootScope.$on('ng2auth:oauth2::success', function (event, data) {
        $timeout(function () {
          $rootScope.$broadcast('ng2auth:oauth2::expired', data);
        }, data.session.expires_in*1000);
      });

      $rootScope.$on('ng2auth:logout::success', function (event, data) {
        session = false;
      });

      return {

        /**
         * @name APICall
         * @ngdoc function
         * @param  {String} query the query string
         * @return {Promise}
         */
        APICall: function (query) {
          var token = this.getAccessToken();
          query = query.split('');
          if(query[0] !== '/') {
            query.unshift('/');
          }
          if(query[query.length-1] !== '/') {
            query.push('/');
          }
          query = query.join('');
          var deferred = $q.defer();
          $http.get('https://graph.facebook.com'+query+'?access_token='+token)
            .success(function (data, status, header, config) {
              deferred.resolve(data);
            })
            .error(function (data, status, header, config) {
              deferred.reject(data);
            });
          return deferred.promise;
        },

        /**
         * @name getAccessToken
         * @ngdoc function
         * @methodOf ng2AuthFacebook.services:OAuth2Facebook
         * @return {Object} Something
         */
        getAccessToken: function () {
          if(session) {
            return session.access_token
          } else {
            $window.open(buildUrl(),'','width=300');
          }
        },

        /**
         * @name getConfig
         * @return {Object} the configuration object
         */
        getConfig: function () {
          return opts;
        }
      }
    }],

    /**
     * @ngdoc function
     * @methodOf ng2AuthFacebook.providers:OAuth2FacebookProvider
     * @name setOption
     * @param  {String} usr the user service name
     * @description
     * Public provider configuration function.
     * Use within a angular.config block.
     */
    configure: function (opt) {
      if(typeof opt !== 'object') {
        throw new Error('ng2AuthFacebook: setOption expects an object');
      }
      opts = angular.extend(opts, opt);
    },

    /**
     * @name getConfig
     * @return {Object} the configuration object
     */
    getConfig: function () {
      return opts;
    }
  }
});