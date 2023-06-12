import { USER_ROLES_NAMES } from 'src/app/shared/common/constants';
import {
  autoGenOptions,
  getOptionLabel,
  parseDateTime,
} from '../../../../../../../shared/common/functions';
import {
  FetchPolicyModel,
  MatSelectOption,
  MembershipStatusOptions,
  FetchParams,
  startingFetchParams,
  User,
} from '../../../../../../../shared/common/models';
import { uiroutes } from '../../../../../../../shared/common/ui-routes';

export interface MemberInput {
  id: Number;
  institution: Number;
  email: String;
  avatar: String;
  member: Number;
  title: String;
  bio: String;
  searchField: String;
  dob: Date;
  address: String;
  phone: number;
  mobile:number;
}

export const emptyMemberFormRecord: User = {
  id: null,
  firstName: null,
  lastName: null,
  name: null,
  email: null,
  avatar: null,
  title: null,
  bio: null,
  role: null,
  dob:null,
  address:null,
  city:null,
  pincode:null,
  state:null,
  country:null,  
  phone:null,
  mobile:null,
  designation:null,
  manualLogin:null,
  googleLogin:null,
  institution: null,
};

export interface MemberStateModel {
  members: User[];
  membersSubscribed: boolean;
  lastPagePublicMembers: number;
  paginatedPublicMembers: any[];
  fetchPolicy: FetchPolicyModel;
  fetchParamObjects: FetchParams[];
  memberFormId: string;
  memberFormRecord: User;
  isFetchingFormRecord: boolean;
  isFetching: boolean;
  errorFetching: boolean;
  formSubmitting: boolean;
  errorSubmitting: boolean;
}

export const defaultMemberState: MemberStateModel = {
  members: [],
  membersSubscribed: false,
  lastPagePublicMembers: null,
  paginatedPublicMembers: [],
  fetchPolicy: null,
  fetchParamObjects: [],
  memberFormId: null,
  memberFormRecord: emptyMemberFormRecord,
  isFetchingFormRecord: false,
  isFetching: false,
  errorFetching: false,
  formSubmitting: false,
  errorSubmitting: false,
};

export const membershipStatusOptions: MatSelectOption[] = autoGenOptions(
  MembershipStatusOptions
); // autoGenOptions(MembershipStatusOptions);

export const memberColumns: any[] = [
  {
    field: 'name',
    cellRenderer: 'memberRenderer',
  },
  {
    field: 'role',
    cellRenderer: (params) => {
      return params?.data?.role?.name;
    },
  },
  {
    field: 'institution',
    cellRenderer: (params) => {
      return params?.data?.institution?.name;
    },
  },
  {
    field: 'membershipStatus',
    cellRenderer: (params) => {
      return getOptionLabel(params.value, membershipStatusOptions);
    },
  },
  // {
  //   field: 'lastActive',
  //   cellRenderer: (params) => {
  //     return parseDateTime(params.value);
  //   },
  //   tooltipField: 'lastActive',
  // },
];

export const LearnerColumnFilters = {
  roles: [
    USER_ROLES_NAMES.LEARNER,
    USER_ROLES_NAMES.CLASS_ADMIN_LEARNER,
    USER_ROLES_NAMES.INSTITUTION_ADMIN,
  ],
  membershipStatusIs: [MembershipStatusOptions.APPROVED],
};

export const generateMemberProfileLink = (member: User): string => {
  return `${uiroutes.MEMBER_PROFILE_ROUTE.route}/${member.username}`;
};
