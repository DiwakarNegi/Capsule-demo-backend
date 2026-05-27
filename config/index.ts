import ai from './ai';
import app from './app';
import cache from './cache';
import db from './db';
import files from './files';
import jwt from './jwt';
import pg from './pg';
import sms from './sms';
import smtp from './smtp';

export default [app, db, smtp, cache, jwt, pg, files, sms, ai];
