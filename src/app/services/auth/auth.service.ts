import { Injectable } from '@angular/core';
import {  HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { Account } from 'src/app/models/account';
import { Booking } from 'src/app/models/booking';

import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Platform } from '@ionic/angular';
import { Android, Desktop } from 'src/app/models/platform';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _user = new BehaviorSubject<any>(null);
  
  options = {
    headers: new HttpHeaders(
      {
        "Access-Control-Allow-Headers":"Content-Type",
        "Access-Control-Allow-Methods":"GET, POST, OPTIONS, PUT, PATCH, DELETE",
        "Access-Control-Allow-Origin":'*'
    }),
    withCredentials: true
  };

  get getUser(){
    return this._user.asObservable();
  }

  get isUserAuthenticated() {
    return this._user
    .asObservable()
    .pipe(
      map(
        (user) => {
          if (user) {
            return true;
          }
          else {
            return false;
          }
        }
      )
    );;
  }

  constructor(
    private http : HttpClient,
    private platform : Platform,
    private android : Android,
    private desktop : Desktop
  ) {

  }

  autoLogin() {
    return from(this.android.getSession())
      .pipe(
        map(
          (storedData) => {
            if(!storedData){
              return null;
            }
            else {
              return storedData;
            }
          }
        ),
        tap(
          (user) => {
            if (user) {
              this._user.next(user);
            }
          }
        ),
        map(
          (user) => {
            return !!user;
          }
        )
      )

  }

  login(userName : string,password : string) : Observable<any>{
    return this.http.post<User>(environment.baseURL + "/users/login" ,  { username: userName, password: password },this.options )
      .pipe(
        map( user => {
                  if (
                    user.role === "accounts" ||
                    user.role === "management" ||
                    user.role === "buisnesshead"
                  ) {
                    let accountUser = new Account(user);
                    this._user.next(accountUser);
                    return accountUser;
                  } else {
                    let bookingUser = new Booking(user);
                    this._user.next(bookingUser);
                    return bookingUser;
                  }
                }),
                tap(
                  (user) => {
                    if(this.platform.is("android")){
                      this.android.storeSession(user);
                    }
                    else if(this.platform.is("desktop")) {
                      this.desktop.storeSession(user);
                    }
                    return this._user;
                  }
                ),
                map(user => {
                  if(user instanceof Account){
                    return "account";
                  }
                  else if(user instanceof Booking){
                    return "booking";
                  }
                })
      )
  }

  logout(){
    return this.http.post<User>(environment.baseURL + "/users/logout",this.options )
      .pipe(
        map(
          (resData) => {
            return resData;
          }
        )
      );
  }
}
