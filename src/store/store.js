import {configureStore} from '@reduxjs/toolkit';
import authRouter from '../authSlice' ;

export const store=configureStore({
    reducer:{
        auth:authReducer
    }
});