import { schemeStaticData } from '../../data/scheme-static-data.js'

export function getAllSchemeNames () {
  return schemeStaticData.map(scheme => scheme.name)
}
