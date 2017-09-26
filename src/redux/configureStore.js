import { createStore, applyMiddleware } from "redux"
import rootReducer from "redux/configureRootReducer"
import createSagaMiddleware from "redux-saga"

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(rootReducer, applyMiddleware(sagaMiddleware))

  if (module.hot) {
    module.hot.accept("redux/configureRootReducer", () => {
      const nextRootReducer = require("redux/configureRootReducer").default
      store.replaceReducer(nextRootReducer)
    })
  }

  return {
    ...store,
    runSaga: sagaMiddleware.run,
  }
}
