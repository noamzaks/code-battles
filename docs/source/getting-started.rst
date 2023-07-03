Getting Started
===============

To create your first game, you need to fork `noamzaks/code-battles`, and clone your fork.
You can do this by clicking the green "Use this template" button in `code-battles <https://github.com/noamzaks/code-battles>`_.

The web part of your game will be inside the `src` directory. Inside `App.tsx`, you will see additional web configuration available as part of Code Battles. 
Part of this configuration is your Firebase project, where all of the code of the bots will be stored (using Cloud Firestore), your users will authenticate, and you can also use it to deploy your website to an address like `code-battles.web.app`.

After cloning your fork, make sure to install all of the dependencies by running `yarn`. 

.. note::
    If you don't have `yarn`, installation is quite simple with `npm i -g yarn`. You can download NodeJS from `from the website <https://nodejs.org>`_.

Now you will need to initialize your Firebase project. To do that, head on over to the `Firebase Console <https://console.firebase.google.com/>`_, and do the following:

- Add a new project, name it however you like. You don't need analytics, but you can enable them if you'd like.
- Enable Cloud Firestore.
- Enable Email and Password authentication. Create an initial user with the email `admin@gmail.com` and a password you'll need to remember. Code Battles uses `@gmail.com` as an arbitrary ending, and practically only uses it as a username.
- In the Project Overview, add a new app, for the web. Copy the configuration, and paste it into a file named `firebase.json` inside the `src` directory. Make sure to only include everything inside the curly brackets, and you might need to add double quotes if your IDE doesn't do this automatically.

After following the above steps, you can run `yarn dev` to test your app locally. Make sure you can sign in as admin. 

To set up deploys to Firebase Hosting, first install firebase tools by running `npm i -g firebase-tools`. 
Then, sign in to your Google account by running `firebase login`.
Initialize your project by running `firebase init`. Make sure to enable Firebase Hosting (you don't need automatic deploys).
Now, you can simply run `yarn deploy` whenever you want to build an deploy your game.

After everything works for you, you can continue to write your game.