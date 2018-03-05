import { connect } from 'react-redux';
import prepare from 'app/utils/prepare';
import { compose } from 'redux';
import {
  editSurvey,
  fetch,
  deleteSurvey,
  fetchTemplate
} from '../../actions/SurveyActions';
import SurveyEditor from './components/SurveyEditor/SurveyEditor';
import { LoginPage } from 'app/components/LoginForm';
import replaceUnlessLoggedIn from 'app/utils/replaceUnlessLoggedIn';
import { selectSurveyById, selectSurveyTemplate } from 'app/reducers/surveys';
import { push } from 'react-router-redux';
import loadingIndicator from 'app/utils/loadingIndicator';

const loadData = (props, dispatch) => {
  const { surveyId } = props.params;
  const { templateType } = props.location.query;
  if (templateType) {
    return Promise.all([
      dispatch(fetchTemplate(templateType)),
      dispatch(fetch(surveyId))
    ]);
  }
  return dispatch(fetch(surveyId));
};

const mapStateToProps = (state, props) => {
  const notFetching = !state.surveys.fetching;
  const surveyId = Number(props.params.surveyId);
  const survey = selectSurveyById(state, { surveyId });
  const templateType = props.location.query.templateType;
  const template = selectSurveyTemplate(state, { ...props, templateType });

  const initialEvent = survey.event && {
    value: survey.event.id,
    label: survey.event.title
  };

  let initialValues = null;
  if (notFetching && !(templateType && !template)) {
    if (template) {
      initialValues = {
        ...template,
        title: survey.title || template.title,
        event: initialEvent,
        activeFrom: survey.event && survey.event.endTime
      };
    } else {
      initialValues = {
        ...survey,
        event: initialEvent,
        questions:
          survey.questions &&
          survey.questions.map(
            question =>
              question.options
                ? {
                    ...question,
                    options: question.options.concat({ optionText: '' })
                  }
                : question
          )
      };
    }
  }

  const surveyToSend = template
    ? { ...survey, questions: template.questions }
    : survey;

  return {
    survey: surveyToSend,
    surveyId,
    fetching: state.surveys.fetching,
    template,
    initialValues,
    notFetching
  };
};

const mapDispatchToProps = {
  submitFunction: editSurvey,
  deleteSurvey,
  push
};

export default compose(
  replaceUnlessLoggedIn(LoginPage),
  prepare(loadData, ['params.surveyId', 'location.query.templateType']),
  connect(mapStateToProps, mapDispatchToProps),
  loadingIndicator(['notFetching'])
)(SurveyEditor);
