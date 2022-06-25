import dotenv from 'dotenv';

// Read from .env file only in case of development
// In production mode, env variables should be provided directly.
const env = process.env.NODE_ENV  || 'development';
if(env==='development'){
    const result2 = dotenv.config({
        path: `./env/${env}.env`,
    });

    if (result2.error) {
        throw result2.error;
    }
}