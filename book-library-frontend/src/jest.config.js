module.exports = {
    transformIgnorePatterns: [
      "/node_modules/(?axios)/"  
    ],
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js'  
    }
};