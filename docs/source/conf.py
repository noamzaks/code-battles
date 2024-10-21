# Configuration file for the Sphinx documentation builder.

# -- Additional path locations
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "code_battles"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "stubs"))

# -- Project information

project = "Code Battles"
copyright = "2024, Noam Zaks"
author = "Noam Zaks"

release = "1.0"
version = "1.0.0"

# -- General configuration

master_doc = "index"

extensions = [
    "sphinx.ext.duration",
    "sphinx.ext.doctest",
    "sphinx.ext.autodoc",
    "sphinx.ext.viewcode",
    "sphinx.ext.autosummary",
    "sphinx.ext.intersphinx",
    "sphinx_mdinclude",
]

intersphinx_mapping = {
    "python": ("https://docs.python.org/3/", None),
    "sphinx": ("https://www.sphinx-doc.org/en/master/", None),
}
intersphinx_disabled_domains = ["std"]

templates_path = ["_templates"]

# -- Options for HTML output

html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
html_logo = "_static/logo.png"
html_favicon = "_static/favicon.ico"
html_theme_options = {
    "logo_only": True,
}
html_context = {
    "display_github": True,
    "github_user": "noamzaks",
    "github_repo": "code-battles",
    "github_version": "main",
    "conf_py_path": "/docs/source/",
}

# -- Options for EPUB output
epub_show_urls = "footnote"

# -- Options for automatic code generation
autodoc_member_order = "bysource"
autodoc_mock_imports = ["js", "pyodide", "pyscript"]
