Setting Up an Event
===================

Creating Teams
++++++++++++++

For each team you want to add you need to create a user.
For instance, if you want a `Mercedes` team, add a user with the email `mercedes@gmail.com` and pick a password.
You are encouraged to pick simple passwords. This does not need to be very secure.

Tournament Configuration
++++++++++++++++++++++++

Inside the Firebase Console, edit the `tournament/info` document (if you didn't create it yet, do so now). 
Create a `teams` array inside of it. Each object in the `teams` array should look like so:

.. code-block:: json
    :linenos:

    {
        "members": "Noam, John, Dan",
        "name": "Mercedes",
        "points": 0
    }

As an admin user, you will be able to set the next round time (at that time you will fetch all of the teams' bots), edit the matches of the next round.

Then, at each round, you should open the round page to the audience and simulate each of the games. After running all of the games, commit the results.

Firestore Security Rules
++++++++++++++++++++++++

You can make sure your competition is secure against teams trying to get each other bots or changing their scores by doing the following:

- Get the user id of your `admin` user.
- Inside Firestore, go to the Rules tab. Set the rules to the following, where UID is **your** admin ID.

.. code-block::
    :linenos:

    rules_version = '2';
    service cloud.firestore {
        match /databases/{database}/documents {
            match /apis/admin {
                allow read: if request.auth.uid != null;
                allow write: if false;
            }
        
            match /apis/{user} {
                allow read, write: if request.auth.uid == user || request.auth.uid == "UID";
            }
            
            match /tournament/info {
                allow read: if request.auth.uid != null;
            }
            
            match /tournament/{user} {
                allow read, write: if request.auth.token.email == user + "@gmail.com" || request.auth.uid == "UID";
            }
        
            match /{document=**} {
                allow read, write: if false;
            }
        }
    }

Team Images
+++++++++++

You should upload an image for each team inside `public/images/teams/TEAM_NAME.png` where `TEAM_NAME` is the team's name in lowercase.
This will show up in the tournament table and after someone wins a simulation.

Additionally, if you use car company themed teams, you can upload `public/images/teams/TEAM_NAME-side.png` and that side profile of 
the winner's car will drive from the left of the screen to the right of it.