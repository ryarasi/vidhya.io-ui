import { Location } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { uiroutes } from 'src/app/shared/common/ui-routes';

@Component({
  selector: 'app-public-component',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
})
export class PublicComponent {
  title = 'vidhya-ui';
  uiroutes = uiroutes;
   _firstTimeSetup: boolean;
  @Input() set firstTimeSetup(status:boolean){
    this._firstTimeSetup = status;
  };
  constructor(private router: Router, private readonly location: Location) {}

  currentRoute(): string {
    return this.location.path().substring(1);
  }
  currentRouteNoteEquals(routes: string[]): boolean {
    let result = true;
    routes.forEach((r) => {
      result = result && !this.currentRoute().toString().includes(r);
    });
    return result;
  }

  showHomePage() {
    // Make sure to add the routes of other components that are allowed to be shown when not logged in fully
    const routes = [
      uiroutes.NEWS_PROFILE_ROUTE.route,
      uiroutes.MEMBER_FORM_ROUTE.route,
      uiroutes.MEMBERSHIPSTATUS_PENDING_STATE_ROUTE.route,
      uiroutes.PROJECT_PROFILE_ROUTE.route,
      uiroutes.PASSWORD_RESET_ROUTE.route,
      uiroutes.CHANGE_PASSWORD.route,
      uiroutes.ISSUE_FORM_ROUTE.route,
      uiroutes.PRIVACY_ROUTE.route,
      uiroutes.TERMS_CONDITIONS_ROUTE.route,
      uiroutes.MEMBER_PROFILE_ROUTE.route,
      uiroutes.INSTITUTION_PROFILE_ROUTE.route,
      uiroutes.ERROR_ROUTE.route,
    ];
    return this.currentRouteNoteEquals(routes);
  }

  routeIs(route) {
    const url = this.router.url;
    const mainroute = url.split('?')[0];

    return mainroute.includes(route);
  }

  /**
   * This method ensures that we get to show select components to the user when not logged in
   * @param route
   * @returns
   */
  showUnprotectedPage(route) {
    switch (route) {
      case uiroutes.PASSWORD_RESET_ROUTE.route:
        if (this.routeIs(uiroutes.PASSWORD_RESET_ROUTE.route)) {
          return true;
        }
        break;
      case uiroutes.CHANGE_PASSWORD.route:
        if(this._firstTimeSetup && this.routeIs(uiroutes.CHANGE_PASSWORD.route)){
          return true;
        }
    
      break;
      case uiroutes.MEMBER_PROFILE_ROUTE.route:
        if (this.routeIs(uiroutes.MEMBER_PROFILE_ROUTE.route)) {
          return true;
        }
        break;      
      case uiroutes.MEMBERSHIPSTATUS_PENDING_STATE_ROUTE.route:
          if (this.routeIs(uiroutes.MEMBERSHIPSTATUS_PENDING_STATE_ROUTE.route)) {
            return true;
          }
          break;
      case uiroutes.NEWS_PROFILE_ROUTE.route:
        if (this.routeIs(uiroutes.NEWS_PROFILE_ROUTE.route)) {
         return true;
        }
        break;
      case uiroutes.PROJECT_PROFILE_ROUTE.route:
        if (this.routeIs(uiroutes.PROJECT_PROFILE_ROUTE.route)) {
          return true;
        }
        break;
      case uiroutes.ISSUE_FORM_ROUTE.route:
        if (this.routeIs(uiroutes.ISSUE_FORM_ROUTE.route)) {
         return true;
        }
        break;
      case uiroutes.INSTITUTION_PROFILE_ROUTE.route:
        if (this.routeIs(uiroutes.INSTITUTION_PROFILE_ROUTE.route)) {
        return true;
        }
        break;
      case uiroutes.PRIVACY_ROUTE.route:
        if (this.routeIs(uiroutes.PRIVACY_ROUTE.route)) {
          return true;
        }
        break;
      case uiroutes.TERMS_CONDITIONS_ROUTE.route:
        if (this.routeIs(uiroutes.TERMS_CONDITIONS_ROUTE.route)) {
          return true;
        }
        break;
      case uiroutes.MEMBER_FORM_ROUTE.route:
        if (
          this._firstTimeSetup &&
          this.routeIs(uiroutes.MEMBER_FORM_ROUTE.route)
        ) {
          return true;
        }
        break;

      case uiroutes.HOME_ROUTE.route:
        if (this.routeIs(uiroutes.HOME_ROUTE.route)) {
          return true;
        }
        break;
      case uiroutes.ERROR_ROUTE.route:
        if (this.currentRoute() == uiroutes.ERROR_ROUTE.route) {
          return true;
        }
        break;
      default:
        this.router.navigate[uiroutes.ERROR_ROUTE.route];
    }
    return false;
  }
  
  // ngOnChanges(changes: SimpleChanges) {
  //   if(changes){
  //     this.firstTimeSetup = changes.firstTimeSetup.firstChange;
  //   }
  // }
}
