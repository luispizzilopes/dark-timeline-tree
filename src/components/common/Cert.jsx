import { CERTAINTY_LABEL } from '../../data/labels.js'

export const Cert = ({ v }) => <span className={'cert c-' + v}>{CERTAINTY_LABEL[v] || v}</span>
