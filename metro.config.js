// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      // Polyfill Node.js modules for React Native
      events: 'events',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
