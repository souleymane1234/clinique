import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const QUESTION_TYPES = {
  SIMPLE: 'SIMPLE',
  MULTIPLE: 'MULTIPLE',
};

export default function OrientationQuestionnaireFormView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    active: true,
    sections: [],
  });

  useEffect(() => {
    if (isEdit) {
      loadQuestionnaire();
    }
  }, [id]);

  const loadQuestionnaire = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getOrientationQuestionnaireById(id);
      if (result.success) {
        const { data } = result;
        // Load blocks and questions
        const blocksResult = await ConsumApi.getOrientationBlocksByQuestionnaire(id);
        if (blocksResult.success) {
          const blocks = blocksResult.data?.data || blocksResult.data || [];
          const sectionsWithQuestions = await Promise.all(
            blocks.map(async (block) => {
              const questionsResult = await ConsumApi.getOrientationQuestionsByBlock(block.id);
              const questions = questionsResult.success
                ? questionsResult.data?.data || questionsResult.data || []
                : [];
              return {
                id: block.id,
                title: block.title,
                order: block.order || 0,
                questions: questions.map((q) => ({
                  id: q.id,
                  title: q.title,
                  type: q.type,
                  options: q.options || [],
                })),
              };
            })
          );
          setFormData({
            title: data.title || '',
            description: data.description || '',
            active: data.active !== undefined ? data.active : true,
            sections: sectionsWithQuestions,
          });
        } else {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            active: data.active !== undefined ? data.active : true,
            sections: [],
          });
        }
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      showError('Erreur', 'Erreur lors du chargement du questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === 'active' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: '',
          order: prev.sections.length,
          questions: [],
        },
      ],
    }));
  };

  const handleRemoveSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  const handleSectionChange = (sectionIndex, field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        [field]: field === 'order' ? parseInt(value, 10) || 0 : value,
      };
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const handleAddQuestion = (sectionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        questions: [
          ...newSections[sectionIndex].questions,
          {
            title: '',
            type: QUESTION_TYPES.SIMPLE,
            options: [{ label: '', weight: 0 }],
          },
        ],
      };
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const handleRemoveQuestion = (sectionIndex, questionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        questions: newSections[sectionIndex].questions.filter(
          (_, index) => index !== questionIndex
        ),
      };
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const handleQuestionChange = (sectionIndex, questionIndex, field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[questionIndex] = {
        ...newSections[sectionIndex].questions[questionIndex],
        [field]: value,
      };
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const handleAddOption = (sectionIndex, questionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[questionIndex].options = [
        ...newSections[sectionIndex].questions[questionIndex].options,
        { label: '', weight: 0 },
      ];
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const handleRemoveOption = (sectionIndex, questionIndex, optionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      const {options} = newSections[sectionIndex].questions[questionIndex];
      if (options.length > 1) {
        newSections[sectionIndex].questions[questionIndex].options = options.filter(
          (_, index) => index !== optionIndex
        );
      }
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const handleOptionChange = (sectionIndex, questionIndex, optionIndex, field) => (event) => {
    const { value: rawValue } = event.target;
    const value = field === 'weight' ? parseInt(rawValue, 10) || 0 : rawValue;
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[questionIndex].options[optionIndex] = {
        ...newSections[sectionIndex].questions[questionIndex].options[optionIndex],
        [field]: value,
      };
      return {
        ...prev,
        sections: newSections,
      };
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      showError('Validation', 'Le titre est requis');
      return false;
    }

    for (let i = 0; i < formData.sections.length; i += 1) {
      const section = formData.sections[i];
      if (!section.title.trim()) {
        showError('Validation', `Le titre de la section ${i + 1} est requis`);
        return false;
      }

      for (let j = 0; j < section.questions.length; j += 1) {
        const question = section.questions[j];
        if (!question.title.trim()) {
          showError('Validation', `Le titre de la question ${j + 1} dans la section ${i + 1} est requis`);
          return false;
        }

        if (question.options.length === 0) {
          showError('Validation', `La question ${j + 1} dans la section ${i + 1} doit avoir au moins une option`);
          return false;
        }

        for (let k = 0; k < question.options.length; k += 1) {
          const option = question.options[k];
          if (!option.label.trim()) {
            showError('Validation', `L'option ${k + 1} de la question ${j + 1} dans la section ${i + 1} est requise`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        active: formData.active,
        sections: formData.sections.map((section) => ({
          title: section.title,
          order: section.order,
          questions: section.questions.map((question) => ({
            title: question.title,
            type: question.type,
            options: question.options.map((option) => ({
              label: option.label,
              weight: option.weight,
            })),
          })),
        })),
      };

      let result;
      if (isEdit) {
        // For edit, update questionnaire first, then handle sections separately
        result = await ConsumApi.updateOrientationQuestionnaire(id, {
          title: formData.title,
          description: formData.description,
          active: formData.active,
        });
        if (result.success) {
          showApiResponse(result, {
            successTitle: 'Questionnaire mis à jour',
            errorTitle: 'Erreur de mise à jour',
          });
          navigate(routesName.adminOrientationQuestionnaires);
        }
      } else {
        result = await ConsumApi.createOrientationQuestionnaire(payload);
        showApiResponse(result, {
          successTitle: 'Questionnaire créé',
          errorTitle: 'Erreur de création',
        });
        if (result.success) {
          navigate(routesName.adminOrientationQuestionnaires);
        }
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      showError('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {contextHolder}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">
          {isEdit ? 'Modifier le Questionnaire' : 'Nouveau Questionnaire'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          {isEdit
            ? 'Modifiez les informations du questionnaire'
            : 'Créez un nouveau questionnaire avec ses sections et questions'}
        </Typography>
      </Box>

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Titre *"
              value={formData.title}
              onChange={handleChange('title')}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
            />

            <FormControlLabel
              control={
                <Switch checked={formData.active} onChange={handleChange('active')} />
              }
              label="Questionnaire actif"
            />
          </Stack>
        </Card>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sections (Blocs)</Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleAddSection}
            >
              Ajouter une section
            </Button>
          </Box>

          {formData.sections.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center' }}>
              <Iconify icon="solar:document-text-bold" width={64} sx={{ mb: 2, color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Aucune section
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Commencez par ajouter une section avec ses questions
              </Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={handleAddSection}
              >
                Ajouter une section
              </Button>
            </Card>
          ) : (
            <Stack spacing={2}>
              {formData.sections.map((section, sectionIndex) => (
                <Accordion key={sectionIndex} defaultExpanded>
                  <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1">
                        Section {sectionIndex + 1}: {section.title || 'Sans titre'}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSection(sectionIndex);
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Titre de la section *"
                        value={section.title}
                        onChange={handleSectionChange(sectionIndex, 'title')}
                        required
                      />
                      <TextField
                        type="number"
                        label="Ordre"
                        value={section.order}
                        onChange={handleSectionChange(sectionIndex, 'order')}
                        inputProps={{ min: 0 }}
                      />

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2">Questions</Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="eva:plus-fill" />}
                            onClick={() => handleAddQuestion(sectionIndex)}
                          >
                            Ajouter une question
                          </Button>
                        </Box>

                        <Stack spacing={2}>
                          {section.questions.map((question, questionIndex) => (
                            <Card key={questionIndex} sx={{ p: 2 }}>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <TextField
                                      fullWidth
                                      label={`Question ${questionIndex + 1} *`}
                                      value={question.title}
                                      onChange={handleQuestionChange(sectionIndex, questionIndex, 'title')}
                                      required
                                      sx={{ mb: 2 }}
                                    />
                                    <TextField
                                      select
                                      fullWidth
                                      label="Type de question"
                                      value={question.type}
                                      onChange={handleQuestionChange(sectionIndex, questionIndex, 'type')}
                                      SelectProps={{
                                        native: true,
                                      }}
                                    >
                                      <option value={QUESTION_TYPES.SIMPLE}>Simple (Choix unique)</option>
                                      <option value={QUESTION_TYPES.MULTIPLE}>Multiple (Choix multiples)</option>
                                    </TextField>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveQuestion(sectionIndex, questionIndex)}
                                    sx={{ ml: 1 }}
                                  >
                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                  </IconButton>
                                </Box>

                                <Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Options de réponse
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="text"
                                      startIcon={<Iconify icon="eva:plus-fill" />}
                                      onClick={() => handleAddOption(sectionIndex, questionIndex)}
                                    >
                                      Ajouter
                                    </Button>
                                  </Box>
                                  <Stack spacing={1}>
                                    {question.options.map((option, optionIndex) => (
                                      <Box key={optionIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                          size="small"
                                          label={`Option ${optionIndex + 1} *`}
                                          value={option.label}
                                          onChange={handleOptionChange(sectionIndex, questionIndex, optionIndex, 'label')}
                                          required
                                          sx={{ flex: 1 }}
                                        />
                                        <TextField
                                          size="small"
                                          type="number"
                                          label="Poids"
                                          value={option.weight}
                                          onChange={handleOptionChange(sectionIndex, questionIndex, optionIndex, 'weight')}
                                          inputProps={{ min: 0 }}
                                          sx={{ width: 100 }}
                                        />
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveOption(sectionIndex, questionIndex, optionIndex)}
                                          disabled={question.options.length <= 1}
                                        >
                                          <Iconify icon="solar:trash-bin-trash-bold" />
                                        </IconButton>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(routesName.adminOrientationQuestionnaires)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Iconify icon="eva:checkmark-fill" />}
          >
            {(() => {
              if (saving) return 'Enregistrement...';
              if (isEdit) return 'Mettre à jour';
              return 'Créer';
            })()}
          </Button>
        </Box>
      </Stack>
    </>
  );
}

