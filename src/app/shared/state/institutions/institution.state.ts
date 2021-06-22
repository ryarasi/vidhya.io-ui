import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import {
  defaultInstitutionState,
  emptyInstitutionFormRecord,
  InstitutionFormCloseURL,
  InstitutionStateModel,
} from './institution.model';

import { Injectable } from '@angular/core';
import {
  CreateUpdateInstitutionAction,
  DeleteInstitutionAction,
  FetchInstitutionsAction,
  ForceRefetchInstitutionsAction,
  GetInstitutionAction,
  InstitutionSubscriptionAction,
  ResetInstitutionFormAction,
} from './institution.actions';
import { INSTITUTION_QUERIES } from './../../api/graphql/queries.graphql';
import { Apollo, Subscription } from 'apollo-angular';
import {
  Institution,
  MatSelectOption,
  PaginationObject,
  SUBSCRIPTION_METHODS,
} from '../../common/models';
import { INSTITUTION_MUTATIONS } from '../../api/graphql/mutations.graphql';
import { ShowNotificationAction } from '../notifications/notification.actions';
import {
  getErrorMessageFromGraphQLResponse,
  subscriptionUpdater,
  updatePaginationObject,
} from '../../common/functions';
import { Router } from '@angular/router';
import { defaultSearchParams } from '../../common/constants';
import { SUBSCRIPTIONS } from '../../api/graphql/subscriptions.graphql';

@State<InstitutionStateModel>({
  name: 'institutionState',
  defaults: defaultInstitutionState,
})
@Injectable()
export class InstitutionState {
  constructor(
    private apollo: Apollo,
    private store: Store,
    private router: Router
  ) {}

  @Selector()
  static listInstitutions(state: InstitutionStateModel): Institution[] {
    return state.institutions;
  }

  @Selector()
  static isFetching(state: InstitutionStateModel): boolean {
    return state.isFetching;
  }

  @Selector()
  static paginationObject(state: InstitutionStateModel): PaginationObject {
    return state.paginationObject;
  }
  @Selector()
  static listInstitutionOptions(
    state: InstitutionStateModel
  ): MatSelectOption[] {
    const options: MatSelectOption[] = state.institutions.map((i) => {
      const option: MatSelectOption = {
        value: i.id,
        label: `${i.name} (${i.location})`,
      };
      return option;
    });
    console.log('institution dropdown ptions', options);
    return options;
  }

  @Selector()
  static errorFetching(state: InstitutionStateModel): boolean {
    return state.errorFetching;
  }

  @Selector()
  static formSubmitting(state: InstitutionStateModel): boolean {
    return state.formSubmitting;
  }

  @Selector()
  static errorSubmitting(state: InstitutionStateModel): boolean {
    return state.errorSubmitting;
  }

  @Selector()
  static getInstitutionFormRecord(state: InstitutionStateModel): Institution {
    return state.institutionFormRecord;
  }

  @Action(ForceRefetchInstitutionsAction)
  forceRefetchInstitutions({
    patchState,
  }: StateContext<InstitutionStateModel>) {
    patchState({ fetchPolicy: 'network-only' });
    this.store.dispatch(
      new FetchInstitutionsAction({ searchParams: defaultSearchParams })
    );
  }

  @Action(FetchInstitutionsAction)
  fetchInstitutions(
    { getState, patchState }: StateContext<InstitutionStateModel>,
    { payload }: FetchInstitutionsAction
  ) {
    const state = getState();
    const { fetchPolicy, paginationObject, fetchedOnce } = state;
    if (!fetchedOnce) {
      patchState({ isFetching: true });
      const { searchParams } = payload;
      const { searchQuery, newPageSize, newPageNumber } = searchParams;
      let newPaginationObject = updatePaginationObject({
        paginationObject,
        newPageNumber,
        newPageSize,
      });
      console.log('new pagination object after the update method => ', {
        newPaginationObject,
      });
      const variables = {
        searchField: searchQuery,
        limit: newPaginationObject.pageSize,
        offset: newPaginationObject.offset,
      };
      console.log('variables for institutions fetch ', { variables });
      this.apollo
        .watchQuery({
          query: INSTITUTION_QUERIES.GET_INSTITUTIONS,
          variables,
          fetchPolicy: 'network-only',
        })
        .valueChanges.subscribe(({ data }: any) => {
          const response = data.institutions;
          const totalCount = response[0]?.totalCount
            ? response[0]?.totalCount
            : 0;

          newPaginationObject = { ...newPaginationObject, totalCount };
          console.log('from after getting institutions', {
            totalCount,
            response,
            newPaginationObject,
          });
          patchState({
            fetchedOnce: true,
            institutions: response,
            paginationObject: newPaginationObject,
            isFetching: false,
          });
          this.store.dispatch(new InstitutionSubscriptionAction());
        });
    }
  }

  @Action(InstitutionSubscriptionAction)
  subscribeToInstitutions({
    getState,
    patchState,
  }: StateContext<InstitutionStateModel>) {
    this.apollo
      .subscribe({
        query: SUBSCRIPTIONS.institution,
      })
      .subscribe((result: any) => {
        const state = getState();
        console.log('institution subscription result ', { result });
        const method = result?.data?.notifyInstitution?.method;
        const institution = result?.data?.notifyInstitution?.institution;
        const { items, paginationObject } = subscriptionUpdater({
          items: state.institutions,
          method,
          subscriptionItem: institution,
          paginationObject: state.paginationObject,
        });
        patchState({ institutions: items, paginationObject });
      });
  }

  @Action(GetInstitutionAction)
  getInstitution(
    { patchState }: StateContext<InstitutionStateModel>,
    { payload }: GetInstitutionAction
  ) {
    const { id } = payload;
    patchState({ isFetching: true });
    this.apollo
      .watchQuery({
        query: INSTITUTION_QUERIES.GET_INSTITUTION,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .valueChanges.subscribe(({ data }: any) => {
        const response = data.institution;
        patchState({ institutionFormRecord: response, isFetching: false });
      });
  }

  @Action(CreateUpdateInstitutionAction)
  createUpdateInstitution(
    { getState, patchState }: StateContext<InstitutionStateModel>,
    { payload }: CreateUpdateInstitutionAction
  ) {
    const state = getState();
    const { form, formDirective } = payload;
    let { formSubmitting } = state;
    if (form.valid) {
      formSubmitting = true;
      patchState({ formSubmitting });
      const values = form.value;
      console.log('Institution Form values', values);
      const updateForm = values.id == null ? false : true;
      const { id, ...sanitizedValues } = values;
      const variables = updateForm
        ? {
            input: sanitizedValues,
            id: values.id, // adding id to the mutation variables if it is an update mutation
          }
        : { input: sanitizedValues };

      this.apollo
        .mutate({
          mutation: updateForm
            ? INSTITUTION_MUTATIONS.UPDATE_INSTITUTION
            : INSTITUTION_MUTATIONS.CREATE_INSTITUTION,
          variables: { ...variables },
        })
        .subscribe(
          ({ data }: any) => {
            const response = updateForm
              ? data.updateInstitution
              : data.createInstitution;
            patchState({ formSubmitting: false });
            console.log('update institution ', { response });
            if (response.ok) {
              this.store.dispatch(
                new ShowNotificationAction({
                  message: `Institution ${
                    updateForm ? 'updated' : 'created'
                  } successfully!`,
                  action: 'success',
                })
              );
              form.reset();
              formDirective.resetForm();
              this.router.navigateByUrl(InstitutionFormCloseURL);
              patchState({
                institutionFormRecord: emptyInstitutionFormRecord,
                fetchPolicy: 'network-only',
              });
            } else {
              this.store.dispatch(
                new ShowNotificationAction({
                  message: getErrorMessageFromGraphQLResponse(response?.errors),
                  action: 'error',
                })
              );
            }
            console.log('From createUpdateInstitution', { response });
          },
          (error) => {
            console.log('Some error happened ', error);
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(error),
                action: 'error',
              })
            );
            patchState({ formSubmitting: false });
          }
        );
    } else {
      this.store.dispatch(
        new ShowNotificationAction({
          message:
            'Please make sure there are no errors in the form before attempting to submit!',
          action: 'error',
        })
      );
    }
  }

  @Action(DeleteInstitutionAction)
  deleteInstitution(
    {}: StateContext<InstitutionStateModel>,
    { payload }: DeleteInstitutionAction
  ) {
    let { id } = payload;
    this.apollo
      .mutate({
        mutation: INSTITUTION_MUTATIONS.DELETE_INSTITUTION,
        variables: { id, fetchPolicy: 'no-cache' },
      })
      .subscribe(
        ({ data }: any) => {
          const response = data.deleteInstitution;
          console.log('from delete institution ', { data });
          if (response.ok) {
            this.store.dispatch(
              new ShowNotificationAction({
                message: 'Institution deleted successfully!',
                action: 'success',
              })
            );
            // this.store.dispatch(
            //   new ForceRefetchInstitutionsAction({
            //     searchParams: defaultSearchParams,
            //   })
            // );
          } else {
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(response?.errors),
                action: 'error',
              })
            );
          }
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
        }
      );
  }

  @Action(ResetInstitutionFormAction)
  resetInstitutionForm({ patchState }: StateContext<InstitutionStateModel>) {
    patchState({
      institutionFormRecord: emptyInstitutionFormRecord,
      formSubmitting: false,
    });
  }
}
