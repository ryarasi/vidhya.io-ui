import {
  FetchPolicy,
  Assignment,
  PaginationObject,
  startingPaginationObject,
} from '../../common/models';

export const emptyAssignmentFormRecord: Assignment = {
  id: null,
  title: null,
  instructions: null,
  course: null,
};
export interface AssignmentStateModel {
  assignments: Assignment[];
  lastPage: number;
  assignmentsSubscribed: boolean;
  fetchPolicy: FetchPolicy;
  paginationObjects: PaginationObject[];
  assignmentFormId: number;
  assignmentFormRecord: Assignment;
  isFetching: boolean;
  errorFetching: boolean;
  formSubmitting: boolean;
  errorSubmitting: boolean;
}

export const defaultAssignmentState: AssignmentStateModel = {
  assignments: [],
  lastPage: null,
  assignmentsSubscribed: false,
  fetchPolicy: null,
  paginationObjects: [startingPaginationObject],
  assignmentFormId: null,
  assignmentFormRecord: emptyAssignmentFormRecord,
  isFetching: false,
  errorFetching: false,
  formSubmitting: false,
  errorSubmitting: false,
};

export const AssignmentFormCloseURL =
  'dashboard?adminSection=Institutions&tab=Assignments';
