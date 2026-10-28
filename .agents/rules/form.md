---
trigger: always_on
---

In case you're implementing any Form use yup for validation always use localized message for showing error messages you can use COMMON_VALIDATIONS namespace in the ar.json and en.json where you can use common validation message like please enter "field name" and so on and if you didn't find the type of message in the COMMON_VALIDATIONS then add a generic key-value pair to the name sapce like for example "fieldName can't be less than "value" and so on for the onSubmit handler always use snackbar to indicate whether the submissions was a success or had an error or validation error and so on and also make them localized.

In case a generic backend mesage that is defined in the backend then add in BE_ERROR namespace in the ar.json and localize this message for example if error wrong_credentials then pass this message to BE_ERROR.wrong_credentials and translate it in ar and en

- For the forms always and I mean always use react-hook-form and make sure to use the following code style

const formSchema = yup.ob.......

const defaultValues = {
nameAr: isEdit ? currentEntity?.nameAr : ""
}

const methods = useForm({
resolver: yupResolver.....,
defaultValues
})

when you fill the form with data in case of edit use the following styles
useEffect(()=>reset(defaultValues)......w
