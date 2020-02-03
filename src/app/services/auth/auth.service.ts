import { Injectable } from '@angular/core';
import {  HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { Account } from 'src/app/models/account';
import { Booking } from 'src/app/models/booking';

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

  constructor(
    private http : HttpClient
  ) {
    console.log(this.options);
   }

  login(userName : string,password : string) : Observable<any>{
    console.log(userName,password);
    return this.http.post<User>(environment.baseURL + "/users/login" ,  { username: userName, password: password },this.options )
      .pipe(
        map( user => {
          console.log(user);
                  if (
                    user.role === "accounts" ||
                    user.role === "management" ||
                    user.role === "buisnesshead"
                  ) {
                    let accountUser = new Account(user);
                    this.storeSession(accountUser);
                    this._user.next(accountUser);
                    return accountUser;
                  } else {
                    let bookingUser = new Booking(user);
                    this.storeSession(bookingUser);
                    this._user.next(bookingUser);
                    return bookingUser;
                  }
                }),
                switchMap(() => {
                  return this._user;
                }),
                map(user => {
                  console.log(user);
                  if(user instanceof Account){
                    return "account";
                  }
                  else if(user instanceof Booking){
                    return "booking";
                  }
                })
      )
  }

  storeSession(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  }

  clearSession() {
    sessionStorage.removeItem("user");
  }
}
