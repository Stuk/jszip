module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "ignorePatterns": ["vendor/*.js", "dist/*.js"],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "curly": "error",
        "eqeqeq": "error",
        "no-new": "error",
        "no-caller": "error",
        "guard-for-in": "error",
        "no-extend-native": "error",
        "strict": [
            "error",
            "global"
        ],
    }
};
