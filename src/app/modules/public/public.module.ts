import { NgModule } from '@angular/core';
import { SharedModule } from './../../shared/modules/shared.module';
import { PublicRoutingModule } from './public-routing.module';
import { NgxsModule } from '@ngxs/store';
import { PublicState } from './state/public/public.state';
import { PublicComponent } from './components/public/public.component';
import { AuthModule } from '../auth/auth.module';
import { ErrorPageComponent } from './components/pages/error/error.component';
import { PublicTabsComponent } from './components/feed/public-lists.component';
import { PublicLearnersFeedComponent } from './components/feed/learners-feed/learners-feed.component';
import { InstitutionProfileComponent } from './components/profiles/public-institution-profile/public-institution-profile.component';
import { InstitutionsFeedComponent } from './components/feed/institutions-feed/institutions-feed.component';
import { HomeComponent } from './components/pages/home/home.component';
import { PasswordResetComponent } from './components/pages/password-reset/password-reset.component';
import { PrivacyComponent } from './components/pages/privacy/privacy.component';
import { PublicUserProfileComponent } from './components/profiles/public-user-profile/public-user-profile.component';
import { UserCoursesComponent } from './components/profiles/public-user-profile/user-profile-tabs/user-profile-courses/user-profile-courses.component';
import { UserProjectsComponent } from './components/profiles/public-user-profile/user-profile-tabs/user-profile-projects/user-profile-projects.component';
import { ProjectModule } from '../dashboard/modules/project/project.module';
import { TermsConditionsComponent } from './components/pages/terms-conditions/terms-conditions.component';
import { AddEditIssueComponent } from '../dashboard/modules/admin/modules/issues/components/add-edit-issue/add-edit-issue.component';
import { PublicNewsFeedComponent } from './components/feed/news-feed/news-feed.component';
import { NewsProfileComponent } from './components/profiles/public-news-profile/public-news-profile.component';
import { ProjectProfileComponent } from './components/profiles/project-profile/project-profile.component';
import { CoursesFeedComponent } from './components/feed/courses-feed/courses-feed.component';
import { CourseDisplayComponent } from './components/feed/courses-feed/course-dialog/course-display.component';
import { ChangePasswordComponent } from './components/pages/change-password/change-password.component';
const declarations = [
  HomeComponent,
  PasswordResetComponent,
  AddEditIssueComponent,
  PrivacyComponent,
  TermsConditionsComponent,
  PublicUserProfileComponent,
  ProjectProfileComponent,
  PublicComponent,
  ErrorPageComponent,
  PublicTabsComponent,
  PublicLearnersFeedComponent,
  InstitutionsFeedComponent,
  PublicNewsFeedComponent,
  InstitutionProfileComponent,
  NewsProfileComponent,
  UserCoursesComponent,
  UserProjectsComponent,
  CoursesFeedComponent,
  CourseDisplayComponent,
  ChangePasswordComponent
];

@NgModule({
  declarations,
  exports: [...declarations],
  imports: [
    SharedModule,
    AuthModule,
    ProjectModule,
    PublicRoutingModule,
    NgxsModule.forFeature([PublicState]),
  ]
})
export class PublicModule {}
