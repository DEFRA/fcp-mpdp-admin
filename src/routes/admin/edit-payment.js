import http2 from 'node:http2'
import Joi from 'joi'
import { fetchPaymentById, updatePayment } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

function parseDateComponents (dateString) {
  if (!dateString) return {}
  const dateStr = String(dateString).split('T')[0]
  const [year, month, day] = dateStr.split('-')
  return {
    paymentDateDay: Number.parseInt(day, 10),
    paymentDateMonth: Number.parseInt(month, 10),
    paymentDateYear: Number.parseInt(year, 10)
  }
}

function parseDateFromComponents (day, month, year) {
  if (!day || !month || !year) return null
  const paddedDay = String(day).padStart(2, '0')
  const paddedMonth = String(month).padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

export const editPayment = [
  {
    method: 'GET',
    path: '/admin/payments/{id}/edit',
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required()
        })
      },
      handler: async function (request, h) {
        const { id } = request.params
        const payment = await fetchPaymentById(id)

        if (!payment) {
          return h.view('errors/404').code(httpConstants.HTTP_STATUS_NOT_FOUND)
        }

        const dateComponents = parseDateComponents(payment.paymentDate)

        return h.view('admin/edit-payment', {
          pageTitle: 'Edit Payment',
          payment: {
            ...payment,
            ...dateComponents
          }
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/{id}/edit',
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required()
        }),
        payload: Joi.object({
          payeeName: Joi.string().max(128).required(),
          partPostcode: Joi.string().max(8).required(),
          town: Joi.string().max(128).optional().allow(''),
          parliamentaryConstituency: Joi.string().max(64).optional().allow(''),
          countyCouncil: Joi.string().max(128).optional().allow(''),
          scheme: Joi.string().max(64).optional().allow(''),
          amount: Joi.number().required(),
          financialYear: Joi.string().max(8).required(),
          paymentDateDay: Joi.number().integer().min(1).max(31).optional().allow(''),
          paymentDateMonth: Joi.number().integer().min(1).max(12).optional().allow(''),
          paymentDateYear: Joi.number().integer().min(1900).max(2100).optional().allow(''),
          schemeDetail: Joi.string().max(128).optional().allow(''),
          activityLevel: Joi.string().max(64).optional().allow('')
        }),
        failAction: async function (request, h, error) {
          const { id } = request.params
          const errors = {}
          error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message
          })

          return h.view('admin/edit-payment', {
            pageTitle: 'Edit Payment',
            payment: { id, ...request.payload },
            errorList: error.details.map(detail => ({
              text: detail.message,
              href: `#${detail.path[0]}`
            })),
            errors
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }
      },
      handler: async function (request, h) {
        const { id } = request.params
        const { paymentDateDay, paymentDateMonth, paymentDateYear, ...rest } = request.payload

        const paymentData = {
          ...rest,
          paymentDate: parseDateFromComponents(paymentDateDay, paymentDateMonth, paymentDateYear)
        }

        await updatePayment(id, paymentData)
        return h.redirect('/admin/payments?success=updated')
      }
    }
  }
]
