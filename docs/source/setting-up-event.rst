Setting Up an Event
===================

Creating Teams
++++++++++++++

For each team you want to add you need to create a user.
For instance, if you want a `Mercedes` team, add a user with the email `mercedes@gmail.com` and pick a password.
You are encouraged to pick simple passwords. This does not need to be very secure.

Tournament Configuration
++++++++++++++++++++++++

You can add teams for your event in the web application itself (inside the `Settings`, which should be visible in the `Admin` block when you're signed in as the admin).
This information will be stored in Firebase.

As an admin user, you will be able to set the next round time (at that time you will fetch all of the teams' bots), edit the matches of the next round.

Then, at each round, you should open the round page to the audience and simulate each of the games. After running all of the games, save the results.

Firestore Security Rules
++++++++++++++++++++++++

You can make sure your competition is secure against teams trying to get each other's bots or changing their scores by simply
going inside Firestore to the Rules tab, and setting the rules to the following:

.. code-block::
    :linenos:

    rules_version = '2';
    service cloud.firestore {
        match /databases/{database}/documents {
            match /bots/public {
                allow read: if request.auth.uid != null;
                allow write: if request.auth.token.email == "admin@gmail.com";
            }
            
            match /bots/{user} {
                allow read, write: if request.auth.token.email == user + "@gmail.com" || request.auth.token.email == "admin@gmail.com";
            }
            
            match /tournament/info {
                allow read: if request.auth.uid != null;
            }
            
            match /tournament/{user} {
                allow read, write: if request.auth.token.email == user + "@gmail.com" || request.auth.token.email == "admin@gmail.com";
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
the winner's car will drive from the left edge of the screen to the right edge.

CLI for Competitors
+++++++++++++++++++

You may encourage your competitors to use the Code Battles CLI which can be installed as simple as running ``pip install code-battles-cli``.

Then, they can run ``code-battles download`` and ``code-battles upload bots/mybot.py`` (for example). They'll need to enter your event's URL
alongside their username and password in the first execution, but it will be saved in `code-battles.json` for successive executions.