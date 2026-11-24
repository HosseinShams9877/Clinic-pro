/* Preserve incoming category bookmarks after the service-page split. */
(function(){
  'use strict';
  var med=['medical','aes','anes','endo'];
  var surg=['surgical','gen','plastic','ortho','uro','eye','ent','gyn'];
  var key=location.hash.slice(1);
  if(med.indexOf(key)!==-1) location.replace('medical-services.html'+location.hash);
  else if(surg.indexOf(key)!==-1) location.replace('surgical-services.html'+location.hash);
})();
