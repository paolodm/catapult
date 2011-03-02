if (process.platform == 'linux'){
    require('./server');
} else {
    console.log();
    console.log('use nodemon instead of d.js:');
    console.log('$ npm install nodemon');
    console.log('$ nodemon server.js');
    console.log();
}