import { takeLatest, put, call } from "redux-saga/effects"
import axios from "axios"
import {
  createRequestPromise,
  getCurrentDateTimeInSeconds,
} from "utils/requestHelper"

const LOGIN_START = "LOGIN_START"
const LOGIN_SUCCESS = "LOGIN_SUCCESS"
const LOGIN_FAILURE = "LOGIN_FAILURE"
const LOGOUT = "LOGOUT"

const initialState = {
  id: "0",
  accessToken: undefined,
  expiresIn: undefined,
  expirationSeconds: undefined,
  loggedIn: false,
  loading: false,
  error: false,
}

// Reducer

export default function reducer(state = initialState, action) {
  const { payload } = action

  switch (action.type) {
    case LOGIN_START:
      return Object.assign({}, state, {
        loading: true,
      })

    case LOGIN_SUCCESS: {
      saveToLocal([
        { key: "accessToken", value: payload.access_token },
        { key: "expiresIn", value: payload.expires_in },
        {
          key: "expirationSeconds",
          value:
            parseInt(payload.expires_in, 10) + getCurrentDateTimeInSeconds(),
        },
      ])

      return Object.assign({}, state, {
        accessToken: payload.access_token,
        expiresIn: payload.expires_in,
        expirationSeconds:
          parseInt(payload.expires_in, 10) + getCurrentDateTimeInSeconds(),
        loading: false,
        loggedIn: true,
        error: false,
      })
    }

    case LOGIN_FAILURE: {
      purgeLocal()

      return Object.assign({}, state, {
        loading: false,
        loggedIn: false,
        error: true,
      })
    }

    case LOGOUT: {
      purgeLocal()

      return Object.assign({}, state, {
        accessToken: undefined,
        expiresIn: undefined,
        expirationSeconds: undefined,
        loading: false,
        loggedIn: false,
        error: false,
      })
    }

    default:
      return state
  }
}

// Utility methods

function saveToLocal(items) {
  items.forEach(({ key, value }) => localStorage.setItem(key, value))
}

function removeFromLocal(items) {
  items.forEach(({ key, value }) => localStorage.removeItem(key))
}

function purgeLocal() {
  removeFromLocal([
    { key: "accessToken", value: undefined },
    { key: "expiresIn", value: undefined },
    { key: "expirationSeconds", value: undefined },
  ])
}

// Actions

export function login(email, password) {
  return {
    type: LOGIN_START,
    payload: { email, password },
  }
}

export function forceLogin(access_token, expires_in) {
  return { type: LOGIN_SUCCESS, payload: { access_token, expires_in } }
}

export function logout() {
  return { type: LOGOUT }
}

// Fetch/Call methods for sagas

function postLogin(email, password) {
  return axios({
    method: "POST",
    url: `${process.env.REACT_APP_API_URL}/api/oauth/token`,
    data: {
      grant_type: "password",
      username: email,
      password: password,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then(response => {
    return response
  })
}

function fetchCurrentUser() {
  return createRequestPromise({
    method: "GET",
    route: "me",
  })
}

// Sagas

function* loginStart(action) {
  const { email, password } = action.payload

  try {
    const response = yield call(postLogin, email, password)
    yield put({ type: LOGIN_SUCCESS, payload: response.data })
  } catch (error) {
    yield put({ type: LOGIN_FAILURE, payload: { error } })
  }
}

// Parant Saga

export function* loginSaga() {
  yield takeLatest(LOGIN_START, loginStart)
}
