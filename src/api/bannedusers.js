'use strict';
var users = require('./users');

module.exports = function(db){
    var bannedUsernames = [];
    var usersApi = users(db);

    function updateBannedUsers(){
        usersApi.getUsers({
            query: {
                banned: true
            },
            size: 1000
        }, function(err, bannedUsers){
            if(err){
                return;
            }

            bannedUsernames = bannedUsers.users.map(function(bannedUser){
                return bannedUser.username;
            });
        });
    }
    
    function updateBannedUsersAndScheduleNext(){
        updateBannedUsers();
        setTimeout(updateBannedUsersAndScheduleNext, 1000 * 60 * 5);
    }
    updateBannedUsersAndScheduleNext();

    return {
        getUsernames: function(){
            return bannedUsernames;
        }
    };
};
