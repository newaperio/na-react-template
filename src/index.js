import React from "react"
import ReactDOM from "react-dom"
import registerServiceWorker from "registerServiceWorker"

import { Provider } from "react-redux"
import configureStore from "redux/configureStore"
import rootSaga from "redux/rootSaga"

import App from "scenes/App/App"
import "index.css"

const store = configureStore()
store.runSaga(rootSaga)

const element = document.getElementById("root")

let render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    element
  )
}

render()

if (module.hot) {
  const renderApp = render

  render = () => {
    try {
      renderApp()
    } catch (error) {
      console.error(error)
    }
  }

  module.hot.accept(<App />, () => {
    setTimeout(render)
  })
}

registerServiceWorker()
