import Service, { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { scheduleOnce, next } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';

export default class ScrollService extends Service {
  @service router;

  guid = `${guidFor(this)}-scroll-target`;
  doScroll = true;

  _hasSetupElement = false;

  constructor() {
    super(...arguments);

    if (window.addEventListener) {
      window.addEventListener('popstate', this.handlePopstate);
    }
  }

  @action
  handlePopstate() {
    // we want the popstate event to be handled in between routeWillChange and routeDidChange
    next(() => {
      this.doScroll = false;
    });
  }

  @action
  routeWillChange() {
    this.doScroll = true;
  }

  @action
  routeDidChange(transition) {
    // don't mess with the scroll there is no from in the route transition (meaning its the initial load)
    if (!transition.from) {
      this.doScroll = true;
      return;
    }

    // we want this to happen after the popstate event is handled
    next(() => {
      scheduleOnce('afterRender', this.scrollUp);
    });
  }

  @action
  scrollUp() {
    if (this.doScroll) {
      this._setupElement();
      document.getElementById(this.guid).focus();
    }

    this.doScroll = true;
  }

  _setupElement() {
    if(this._hasSetupElement) {
      return;
    }

    const element = document.createElement('div');
    const text = document.createTextNode('The page navigation is complete. You may now navigate the page content as you wish.');
    element.append(text);
    element.setAttribute('id', this.guid);
    element.setAttribute('class', 'ember-scroll-navigation-message');
    element.setAttribute('tabindex', -1);
    element.setAttribute('role', 'text');
    document.body.prepend(element);

    this._hasSetupElement = true;
  }

  willDestroy() {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', this.handlePopstate);
    }

    const element = document.getElementById(this.guid);
    if (element) {
      element.remove();
    }

    super.willDestroy();
  }
}
