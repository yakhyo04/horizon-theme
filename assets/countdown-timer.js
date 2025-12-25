import { Component } from '@theme/component';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * @typedef {Object} CountdownTimerRefs
 * @property {HTMLElement} [timer]
 * @property {HTMLElement} [cta]
 * @property {HTMLElement} [ongoingMessage]
 * @property {HTMLElement} [finishedMessage]
 * @property {HTMLElement} [days]
 * @property {HTMLElement} [hours]
 * @property {HTMLElement} [minutes]
 * @property {HTMLElement} [seconds]
 * @property {HTMLElement} [daysWrapper]
 * @property {HTMLElement} [hoursWrapper]
 * @property {HTMLElement} [minutesWrapper]
 * @property {HTMLElement} [secondsWrapper]
 */

/**
 * Countdown timer component that displays time remaining until a specified end date.
 * @extends {Component<CountdownTimerRefs>}
 */
class CountdownTimer extends Component {
  /** @type {number | null} */
  #intervalId = null;

  /** @type {number} */
  #startDate = 0;

  /** @type {number} */
  #endDate = 0;

  connectedCallback() {
    super.connectedCallback();

    const startDateAttr = this.getAttribute('data-countdown-timer-start-date');
    const endDateAttr = this.getAttribute('data-countdown-timer-end-date');

    if (!startDateAttr || !endDateAttr) return;

    this.#startDate = this.#getDateByTimezone(DEFAULT_TIMEZONE, startDateAttr);
    this.#endDate = this.#getDateByTimezone(DEFAULT_TIMEZONE, endDateAttr);

    const now = Date.now();
    const isTimerActive = this.#startDate < now && now < this.#endDate;

    if (isTimerActive) {
      this.#showTimer();
      this.#startCountdown();
    } else {
      this.#handleTimerEnd();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopCountdown();
  }

  #showTimer() {
    this.refs.timer?.setAttribute('show', '');
  }

  #startCountdown() {
    this.#updateCountdown();
    this.#intervalId = window.setInterval(() => this.#updateCountdown(), MS_PER_SECOND);
  }

  #stopCountdown() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  #updateCountdown() {
    const now = Date.now();
    const distance = this.#endDate - now;

    if (distance < 0) {
      this.#stopCountdown();
      this.#handleTimerEnd();
      return;
    }

    const days = Math.floor(distance / MS_PER_DAY);
    const hours = Math.floor((distance % MS_PER_DAY) / MS_PER_HOUR);
    const minutes = Math.floor((distance % MS_PER_HOUR) / MS_PER_MINUTE);
    const seconds = Math.floor((distance % MS_PER_MINUTE) / MS_PER_SECOND);

    if (days <= 0) {
      this.refs.daysWrapper?.remove();
    } else {
      this.#renderTimeUnit(this.refs.days, days);
    }

    this.#renderTimeUnit(this.refs.hours, hours);
    this.#renderTimeUnit(this.refs.minutes, minutes);
    this.#renderTimeUnit(this.refs.seconds, seconds);
  }

  /**
   * Converts a date string to a timestamp adjusted for the specified timezone.
   * @param {string} timeZone - The target timezone (e.g., 'America/New_York')
   * @param {string} dateString - The date string to convert
   * @returns {number} The timestamp in milliseconds
   */
  #getDateByTimezone(timeZone, dateString) {
    const localeString = new Date().toLocaleString('en', {
      timeZone,
      timeZoneName: 'longOffset',
    });

    const match = localeString.match(/([+-]\d+):(\d+)$/);
    const [, hoursOffset = '+00', minutesOffset = '00'] = match || [];

    const hours = parseInt(hoursOffset, 10);
    const minutes = parseInt(minutesOffset, 10);
    const timeZoneOffset = hours * 60 + (hours > 0 ? minutes : -minutes);

    const localDate = new Date(dateString);
    const localOffset = localDate.getTimezoneOffset();

    return localDate.setMinutes(localDate.getMinutes() - localOffset - timeZoneOffset);
  }

  /**
   * Renders a time value as two separate digit spans.
   * @param {HTMLElement | undefined} element - The container element
   * @param {number} value - The time value to render
   */
  #renderTimeUnit(element, value) {
    if (!element) return;

    const paddedValue = String(value).padStart(2, '0');
    element.innerHTML = `<span>${paddedValue[0]}</span><span>${paddedValue[1]}</span>`;
  }

  #handleTimerEnd() {
    this.refs.timer?.removeAttribute('show');
    this.refs.ongoingMessage?.removeAttribute('show');
    this.refs.finishedMessage?.setAttribute('show', '');
    this.refs.cta?.removeAttribute('show');
  }
}

customElements.define('countdown-timer', CountdownTimer);
