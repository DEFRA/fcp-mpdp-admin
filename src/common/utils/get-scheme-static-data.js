import { schemeStaticData } from '../../data/scheme-static-data.js'

export function getSchemeStaticData (schemeName) {
  return schemeStaticData.find(scheme => scheme.name.toLowerCase() === schemeName.toLowerCase())
}
