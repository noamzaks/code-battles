Getting Started
===============

Forking and Cloning
+++++++++++++++++++

To create your first game, you need to fork `noamzaks/code-battles`, and clone your fork.
You can do this by clicking the green "Use this template" button in `code-battles <https://github.com/noamzaks/code-battles>`_.

The web part of your game will be inside the `src` directory. Inside `App.tsx`, you will see additional web configuration available as part of Code Battles. 
Part of this configuration is your Firebase project, where all of the code of the bots will be stored (using Cloud Firestore), your users will authenticate, and you can also use it to deploy your website to an address like `code-battles.web.app`.

After cloning your fork,install all of the dependencies by running ``bun install``. 

.. note::
    If you don't have ``bun``, follow the instructions on their `website <https://bun.sh/>`_.

You also install to install `pdoc <https://pdoc.dev/>`_ by running ``pip install pdoc``. This automatically creates the fancy API documentation page for you.

Initializing Firebase
+++++++++++++++++++++

To initialize a Firebase project for your game, open the `Firebase Console <https://console.firebase.google.com/>`_, and do the following:

- Add a new project, name it however you like. You don't need analytics, but you can enable them if you'd like.

  .. note::
      If you name your project `fun-battles` for example, you'll have the domain `fun-battles.web.app`. This is assuming the project name is indeed available.
- Enable Cloud Firestore.
- Enable Email and Password authentication. Create an initial user with the email `admin@gmail.com` and a password you'll need to remember. 

  .. note::
      Code Battles uses `@gmail.com` arbitrarily. Using Firebase requires having an actual email, and we assume team names are picked such that the corresponding emails are not available to the competitors, i.e. `mercedes@gmail.com`.
- In the Project Overview, add a new app, for the web. Copy the configuration, and paste it into a file named `firebase.json` inside the `src` directory. Make sure to only include everything inside the curly brackets, and you might need to add double quotes if your IDE doesn't do this automatically.

After following the above steps, you can run ``bun run dev`` to test your app locally. Make sure you can sign in as admin. 

.. note::
    You may need to run this twice, because when the build starts some files are copied from the components library, so the first time running this command may run into some issues.

Setting Up Firebase Hosting
+++++++++++++++++++++++++++

Firebase Hosting makes it easy to host your code battles at a domain such as `code-battles.web.app`, and update it as simply as running ``bun run deploy``.
To set this up, inside the repository's root directory:

- Then, sign in to your Google account by running ``bun run firebase login``.
- Initialize your project by running ``bun run firebase init``. Make sure to enable Firebase Hosting (you don't need automatic deploys).
- Now, you can simply run ``bun run deploy`` whenever you want to build an deploy your game.

After everything works for you, you can continue on to write your game!