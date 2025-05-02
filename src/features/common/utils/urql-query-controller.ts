import { ReactiveController, ReactiveControllerHost } from 'lit';
import { TypedDocumentNode, AnyVariables } from '@urql/core';
import urqlClient from '@utils/urql-client';

/**
 * A controller for managing urql query subscriptions in Lit components.
 *
 * Features:
 * - Automatically subscribes to queries
 * - Handles visibility changes (pauses when tab is hidden)
 * - Cleans up subscriptions when the component disconnects
 * - Supports reactive variables that trigger re-subscription when changed
 */
export class UrqlQueryController<TData, TVariables extends AnyVariables>
  implements ReactiveController
{
  private subscription: { unsubscribe: () => void } | null = null;
  private _variables: TVariables;
  private _document: TypedDocumentNode<TData, TVariables>;
  private _callback: (result: { data?: TData; error?: Error }) => void;
  private _isActive = false;
  private readonly handleVisibilityChange: () => void;

  /**
   * Creates a new UrqlQueryController
   *
   * @param host The Lit component hosting this controller
   * @param queryDocument The GraphQL document (query/subscription)
   * @param variables The variables for the query
   * @param callback Function called with query results
   */
  constructor(
    private host: ReactiveControllerHost,
    queryDocument: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    callback: (result: { data?: TData; error?: Error }) => void
  ) {
    this._document = queryDocument;
    this._variables = variables;
    this._callback = callback;
    this.host.addController(this);

    // Initialize handleVisibilityChange here. 'document' now correctly refers to the global object.
    this.handleVisibilityChange = (): void => {
      if (document.hidden) {
        this.unsubscribe();
      } else if (this._isActive) {
        this.subscribe();
      }
    };
  }

  /**
   * Update the variables and re-subscribe if the component is connected
   */
  setVariablesAndSubscribe(variables: TVariables): void {
    this._variables = variables;
    if (this._isActive) {
      this.subscribe();
    }
  }

  /**
   * Update the callback function
   */
  setCallback(
    callback: (result: { data?: TData; error?: Error }) => void
  ): void {
    this._callback = callback;
    // No need to resubscribe as the subscription will use the new callback
  }

  /**
   * Manually refresh the query
   */
  refresh(): void {
    if (this._isActive) {
      this.subscribe();
    }
  }

  /**
   * Called when the host is connected
   */
  hostConnected(): void {
    this._isActive = true;
    this.subscribe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Called when the host is disconnected
   */
  hostDisconnected(): void {
    this._isActive = false;
    this.unsubscribe();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  /**
   * Subscribe to the query
   */
  private subscribe(): void {
    // Clean up any existing subscription
    this.unsubscribe();

    // Create a new subscription
    this.subscription = urqlClient
      .query(this._document, this._variables)
      .subscribe((result) => {
        this._callback(result);
      });
  }

  /**
   * Unsubscribe from the query
   */
  private unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}
