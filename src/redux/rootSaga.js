import { loginSaga } from "redux/ducks/User"
import { all } from "redux-saga/effects"

export default function* rootSaga() {
  yield all([loginSaga()])
}
