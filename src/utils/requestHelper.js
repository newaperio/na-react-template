import axios from "axios"

export const createRequest = (requestParams, resolve, catchError) => {
  return createRequestPromise(requestParams)
    .then(response => {
      if (resolve) resolve(response)
    })
    .catch(error => {
      console.error(error)

      const status = error.response ? error.response.status : undefined

      if (status === 401) {
        refreshToken(requestParams, resolve, catchError)
      } else if (status === 403) {
        window.location = "/"
      } else {
        if (catchError) catchError(error)
      }
    })
}

export const createRequestPromise = requestParams => {
  if (
    isTokenExpired() &&
    (!requestParams.route.includes("users") && requestParams.method !== "POST")
  ) {
    return refreshToken(requestParams)
  } else {
    let jsonType = "application/vnd.api+json"

    let request = {
      method: requestParams.method,
      url: `${process.env.REACT_APP_API_URL}/api/v1/${requestParams.route}`,
      headers: {
        Authorization: `bearer ${localStorage.getItem("accessToken")}`,
        Accept: jsonType,
      },
      data: requestParams.data,
      params: requestParams.query,
    }

    if (idempotent(requestParams.method)) {
      request.headers["Content-Type"] = jsonType
    }

    return axios(request)
  }
}

export const asyncGet = async route => {
  try {
    return await createRequestPromise({ method: "GET", route })
  } catch (error) {
    console.error(error)
  }
}

const idempotent = method => {
  return method === "POST" || method === "PATCH" || method === "PUT"
}

const refreshToken = (requestParams, resolve, catchError) => {
  return axios({
    method: "POST",
    url: `${process.env.REACT_APP_API_URL}/api/oauth/token`,
    data: {
      grant_type: "refresh_token",
      token: localStorage.getItem("accessToken"),
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then(response => {
      localStorage.setItem("accessToken", response.data.access_token)
      localStorage.setItem("expiresIn", response.data.expires_in)
      localStorage.setItem(
        "expirationSeconds",
        parseInt(response.data.expires_in, 10) + getCurrentDateTimeInSeconds()
      )
      return createRequestPromise(requestParams)
    })
    .catch(err => logout())
}

const logout = () => {
  localStorage.setItem("accessToken", undefined)
  localStorage.setItem("expiresIn", undefined)
  localStorage.setItem("expirationSeconds", undefined)
  window.location = "/login"
  return null
}

export const getCurrentDateTimeInSeconds = () => {
  return parseInt(new Date().getTime() / 1000, 10)
}

export const isTokenExpired = () => {
  let expirationDateBuffed = parseInt(
    localStorage.getItem("expirationSeconds") - 300,
    10
  )
  return getCurrentDateTimeInSeconds() >= expirationDateBuffed
}

export const getQueryParam = (history, param) => {
  const urlParam = RegExp(`[?&]${param}=([^&]*)`).exec(history.location.search)

  return urlParam ? urlParam[1] : undefined
}

export const getErrorFromPointer = (error, pointer) => {
  if (error.response && error.response.data && error.response.data.errors) {
    const errors = error.response.data.errors
    const specificPointer = errors.find(
      potentialError =>
        potentialError.source &&
        potentialError.source.pointer === `/data/attributes/${pointer}`
    )

    if (specificPointer) {
      return specificPointer.detail
    }
  }
}
