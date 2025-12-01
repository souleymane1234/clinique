import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import { ConfirmDeleteDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

const QUESTION_TYPES = {
  SIMPLE: 'SIMPLE',
  MULTIPLE: 'MULTIPLE',
};

export default function OrientationQuestionnaireDetailsView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [blockDialog, setBlockDialog] = useState({ open: false, block: null, mode: 'create' });
  const [questionDialog, setQuestionDialog] = useState({ open: false, question: null, blockId: null, mode: 'create' });
  const [optionDialog, setOptionDialog] = useState({ open: false, option: null, questionId: null, mode: 'create' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null, loading: false });
  const [blockFormData, setBlockFormData] = useState({ title: '', order: 0 });
  const [questionFormData, setQuestionFormData] = useState({ title: '', type: QUESTION_TYPES.SIMPLE });
  const [optionFormData, setOptionFormData] = useState({ label: '', weight: 0 });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionnaireResult, blocksResult] = await Promise.all([
        ConsumApi.getOrientationQuestionnaireById(id),
        ConsumApi.getOrientationBlocksByQuestionnaire(id),
      ]);

      if (questionnaireResult.success) {
        setQuestionnaire(questionnaireResult.data);
      }

      if (blocksResult.success) {
        const blocksData = blocksResult.data?.data || blocksResult.data || [];
        // Load questions for each block
        const blocksWithQuestions = await Promise.all(
          blocksData.map(async (block) => {
            const questionsResult = await ConsumApi.getOrientationQuestionsByBlock(block.id);
            const questions = questionsResult.success
              ? questionsResult.data?.data || questionsResult.data || []
              : [];
            return { ...block, questions };
          })
        );
        setBlocks(blocksWithQuestions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Erreur', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Block management
  const handleOpenBlockDialog = (block = null) => {
    if (block) {
      setBlockFormData({ title: block.title, order: block.order || 0 });
      setBlockDialog({ open: true, block, mode: 'edit' });
    } else {
      setBlockFormData({ title: '', order: blocks.length });
      setBlockDialog({ open: true, block: null, mode: 'create' });
    }
  };

  const handleCloseBlockDialog = () => {
    setBlockDialog({ open: false, block: null, mode: 'create' });
    setBlockFormData({ title: '', order: 0 });
  };

  const handleSaveBlock = async () => {
    if (!blockFormData.title.trim()) {
      showError('Validation', 'Le titre du bloc est requis');
      return;
    }

    try {
      let result;
      if (blockDialog.mode === 'create') {
        result = await ConsumApi.createOrientationBlock({
          questionnaireId: id,
          title: blockFormData.title,
          order: blockFormData.order,
        });
      } else {
        result = await ConsumApi.updateOrientationBlock(blockDialog.block.id, {
          title: blockFormData.title,
          order: blockFormData.order,
        });
      }

      showApiResponse(result, {
        successTitle: blockDialog.mode === 'create' ? 'Bloc créé' : 'Bloc mis à jour',
        errorTitle: 'Erreur',
      });

      if (result.success) {
        handleCloseBlockDialog();
        loadData();
      }
    } catch (error) {
      console.error('Error saving block:', error);
      showError('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDeleteBlock = (block) => {
    setDeleteDialog({ open: true, type: 'block', id: block.id, loading: false });
  };

  // Question management
  const handleOpenQuestionDialog = (blockId, question = null) => {
    if (question) {
      setQuestionFormData({ title: question.title, type: question.type });
      setQuestionDialog({ open: true, question, blockId, mode: 'edit' });
    } else {
      setQuestionFormData({ title: '', type: QUESTION_TYPES.SIMPLE });
      setQuestionDialog({ open: true, question: null, blockId, mode: 'create' });
    }
  };

  const handleCloseQuestionDialog = () => {
    setQuestionDialog({ open: false, question: null, blockId: null, mode: 'create' });
    setQuestionFormData({ title: '', type: QUESTION_TYPES.SIMPLE });
  };

  const handleSaveQuestion = async () => {
    if (!questionFormData.title.trim()) {
      showError('Validation', 'Le titre de la question est requis');
      return;
    }

    try {
      let result;
      if (questionDialog.mode === 'create') {
        result = await ConsumApi.createOrientationQuestion({
          blocId: questionDialog.blockId,
          title: questionFormData.title,
          type: questionFormData.type,
          options: [{ label: 'Option 1', weight: 0 }],
        });
      } else {
        result = await ConsumApi.updateOrientationQuestion(questionDialog.question.id, {
          title: questionFormData.title,
          type: questionFormData.type,
        });
      }

      showApiResponse(result, {
        successTitle: questionDialog.mode === 'create' ? 'Question créée' : 'Question mise à jour',
        errorTitle: 'Erreur',
      });

      if (result.success) {
        handleCloseQuestionDialog();
        loadData();
      }
    } catch (error) {
      console.error('Error saving question:', error);
      showError('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDeleteQuestion = (question) => {
    setDeleteDialog({ open: true, type: 'question', id: question.id, loading: false });
  };

  // Option management
  const handleOpenOptionDialog = (questionId, option = null) => {
    if (option) {
      setOptionFormData({ label: option.label, weight: option.weight || 0 });
      setOptionDialog({ open: true, option, questionId, mode: 'edit' });
    } else {
      setOptionFormData({ label: '', weight: 0 });
      setOptionDialog({ open: true, option: null, questionId, mode: 'create' });
    }
  };

  const handleCloseOptionDialog = () => {
    setOptionDialog({ open: false, option: null, questionId: null, mode: 'create' });
    setOptionFormData({ label: '', weight: 0 });
  };

  const handleSaveOption = async () => {
    if (!optionFormData.label.trim()) {
      showError('Validation', 'Le label de l\'option est requis');
      return;
    }

    try {
      if (optionDialog.mode === 'edit') {
        const result = await ConsumApi.updateOrientationOption(optionDialog.option.id, {
          label: optionFormData.label,
          weight: optionFormData.weight,
        });

        showApiResponse(result, {
          successTitle: 'Option mise à jour',
          errorTitle: 'Erreur',
        });

        if (result.success) {
          handleCloseOptionDialog();
          loadData();
        }
      } else {
        // For creating options, we need to get the question first and add the option
        // This would require a different API endpoint or we handle it differently
        showError('Info', 'La création d\'options se fait via l\'édition de la question');
      }
    } catch (error) {
      console.error('Error saving option:', error);
      showError('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDeleteOption = (option) => {
    setDeleteDialog({ open: true, type: 'option', id: option.id, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const { type, id: itemId } = deleteDialog;
    setDeleteDialog({ ...deleteDialog, loading: true });

    try {
      let result;
      switch (type) {
        case 'block':
          result = await ConsumApi.deleteOrientationBlock(itemId);
          break;
        case 'question':
          result = await ConsumApi.deleteOrientationQuestion(itemId);
          break;
        case 'option':
          result = await ConsumApi.deleteOrientationOption(itemId);
          break;
        default:
          return;
      }

      showApiResponse(result, {
        successTitle: 'Suppression réussie',
        errorTitle: 'Erreur de suppression',
      });

      if (result.success) {
        setDeleteDialog({ open: false, type: '', id: null, loading: false });
        loadData();
      } else {
        setDeleteDialog({ ...deleteDialog, loading: false });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showError('Erreur', 'Une erreur est survenue lors de la suppression');
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!questionnaire) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Questionnaire non trouvé</Typography>
      </Box>
    );
  }

  return (
    <>
      {contextHolder}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">{questionnaire.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {questionnaire.description || 'Aucune description'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => navigate(routesName.adminOrientationQuestionnaires)}
          >
            Retour
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => navigate(routesName.adminOrientationQuestionnaireEdit.replace(':id', id))}
          >
            Modifier
          </Button>
        </Box>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Statut
            </Typography>
            <Chip
              label={questionnaire.active ? 'Actif' : 'Inactif'}
              color={questionnaire.active ? 'success' : 'default'}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Blocs
            </Typography>
            <Typography variant="h6">{questionnaire.totalBlocks || blocks.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Questions
            </Typography>
            <Typography variant="h6">{questionnaire.totalQuestions || 0}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Sessions
            </Typography>
            <Typography variant="h6">{questionnaire.totalSessions || 0}</Typography>
          </Box>
        </Stack>
      </Card>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Blocs de Questions</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => handleOpenBlockDialog()}
          >
            Ajouter un bloc
          </Button>
        </Box>

        {blocks.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Iconify icon="solar:document-text-bold" width={64} sx={{ mb: 2, color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Aucun bloc
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Commencez par ajouter un bloc de questions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => handleOpenBlockDialog()}
            >
              Ajouter un bloc
            </Button>
          </Card>
        ) : (
          <Stack spacing={2}>
            {blocks.map((block) => (
              <Accordion key={block.id} defaultExpanded>
                <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle1">{block.title}</Typography>
                    <Chip label={`${block.totalQuestions || block.questions?.length || 0} questions`} size="small" />
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBlockDialog(block);
                          }}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block);
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Iconify icon="eva:plus-fill" />}
                        onClick={() => handleOpenQuestionDialog(block.id)}
                      >
                        Ajouter une question
                      </Button>
                    </Box>

                    {block.questions && block.questions.length > 0 ? (
                      <Stack spacing={2}>
                        {block.questions.map((question) => (
                          <Card key={question.id} sx={{ p: 2 }}>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {question.title}
                                  </Typography>
                                  <Chip
                                    label={question.type}
                                    size="small"
                                    color={question.type === QUESTION_TYPES.SIMPLE ? 'primary' : 'secondary'}
                                  />
                                </Box>
                                <Box>
                                  <Tooltip title="Modifier">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenQuestionDialog(block.id, question)}
                                    >
                                      <Iconify icon="solar:pen-bold" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Supprimer">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteQuestion(question)}
                                    >
                                      <Iconify icon="solar:trash-bin-trash-bold" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>

                              {question.options && question.options.length > 0 && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    Options de réponse:
                                  </Typography>
                                  <Stack spacing={1}>
                                    {question.options.map((option) => (
                                      <Box
                                        key={option.id}
                                        sx={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          p: 1,
                                          bgcolor: 'background.neutral',
                                          borderRadius: 1,
                                        }}
                                      >
                                        <Typography variant="body2">
                                          {option.label} (Poids: {option.weight})
                                        </Typography>
                                        <Box>
                                          <Tooltip title="Modifier">
                                            <IconButton
                                              size="small"
                                              onClick={() => handleOpenOptionDialog(question.id, option)}
                                            >
                                              <Iconify icon="solar:pen-bold" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Supprimer">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => handleDeleteOption(option)}
                                            >
                                              <Iconify icon="solar:trash-bin-trash-bold" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Aucune question dans ce bloc
                      </Typography>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </Box>

      {/* Block Dialog */}
      <Dialog open={blockDialog.open} onClose={handleCloseBlockDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {blockDialog.mode === 'create' ? 'Nouveau Bloc' : 'Modifier le Bloc'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Titre *"
              value={blockFormData.title}
              onChange={(e) => setBlockFormData({ ...blockFormData, title: e.target.value })}
              required
            />
            <TextField
              type="number"
              fullWidth
              label="Ordre"
              value={blockFormData.order}
              onChange={(e) => setBlockFormData({ ...blockFormData, order: parseInt(e.target.value, 10) || 0 })}
              inputProps={{ min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlockDialog}>Annuler</Button>
          <Button onClick={handleSaveBlock} variant="contained">
            {blockDialog.mode === 'create' ? 'Créer' : 'Mettre à jour'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog.open} onClose={handleCloseQuestionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {questionDialog.mode === 'create' ? 'Nouvelle Question' : 'Modifier la Question'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Titre *"
              value={questionFormData.title}
              onChange={(e) => setQuestionFormData({ ...questionFormData, title: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={questionFormData.type}
                label="Type"
                onChange={(e) => setQuestionFormData({ ...questionFormData, type: e.target.value })}
              >
                <MenuItem value={QUESTION_TYPES.SIMPLE}>Simple (Choix unique)</MenuItem>
                <MenuItem value={QUESTION_TYPES.MULTIPLE}>Multiple (Choix multiples)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuestionDialog}>Annuler</Button>
          <Button onClick={handleSaveQuestion} variant="contained">
            {questionDialog.mode === 'create' ? 'Créer' : 'Mettre à jour'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={optionDialog.open} onClose={handleCloseOptionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {optionDialog.mode === 'create' ? 'Nouvelle Option' : 'Modifier l\'Option'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Label *"
              value={optionFormData.label}
              onChange={(e) => setOptionFormData({ ...optionFormData, label: e.target.value })}
              required
            />
            <TextField
              type="number"
              fullWidth
              label="Poids"
              value={optionFormData.weight}
              onChange={(e) => setOptionFormData({ ...optionFormData, weight: parseInt(e.target.value, 10) || 0 })}
              inputProps={{ min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOptionDialog}>Annuler</Button>
          <Button onClick={handleSaveOption} variant="contained" disabled={optionDialog.mode === 'create'}>
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: '', id: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        loading={deleteDialog.loading}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
      />
    </>
  );
}

