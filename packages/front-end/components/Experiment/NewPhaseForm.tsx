import { FC } from "react";
import {
  ExperimentInterfaceStringDates,
  ExperimentPhaseStringDates,
} from "back-end/types/experiment";
import useForm from "../../hooks/useForm";
import Modal from "../Modal";
import { useAuth } from "../../services/auth";
import TextareaAutosize from "react-textarea-autosize";
import { useWatching } from "../../services/WatchProvider";
import { getEvenSplit } from "../../services/utils";

const NewPhaseForm: FC<{
  experiment: ExperimentInterfaceStringDates;
  mutate: () => void;
  close: () => void;
}> = ({ experiment, close, mutate }) => {
  const { refreshWatching } = useWatching();

  const firstPhase = !experiment.phases.length;

  const prevPhase: Partial<ExperimentPhaseStringDates> =
    experiment.phases[experiment.phases.length - 1] || {};

  const [value, inputProps, manualUpdate] = useForm(
    {
      phase: prevPhase.phase || "main",
      coverage: prevPhase.coverage || 1,
      variationWeights:
        prevPhase.variationWeights ||
        getEvenSplit(experiment.variations.length),
      reason: "",
      dateStarted: new Date().toISOString().substr(0, 16),
      targeting: prevPhase.targeting || "",
    },
    experiment.id,
    {
      className: "form-control",
    }
  );

  const { apiCall } = useAuth();

  // Make sure variation weights add up to 1 (allow for a little bit of rounding error)
  const totalWeights = value.variationWeights.reduce(
    (total: number, weight: number) => total + weight,
    0
  );
  const isValid = totalWeights > 0.99 && totalWeights < 1.01;

  const submit = async () => {
    if (!isValid) throw new Error("Variation weights must sum to 1");

    const body = {
      ...value,
    };

    await apiCall<{ status: number; message?: string }>(
      `/experiment/${experiment.id}/phase`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    mutate();
    refreshWatching();
  };

  return (
    <Modal
      header={firstPhase ? "Start Experiment" : "New Experiment Phase"}
      close={close}
      open={true}
      submit={submit}
      cta={"Start"}
      closeCta="Cancel"
      size="lg"
    >
      {!firstPhase && (
        <div className="alert alert-warning">
          Changing the traffic percent or split will start a new phase of the
          experiment. All previously collected results data will be archived and
          it will start fresh from this point on.
        </div>
      )}
      <div className="row">
        {!firstPhase && (
          <div className="form-group col-lg">
            <label>Reason for Starting New Phase</label>
            <textarea {...inputProps.reason} placeholder="(optional)" />
          </div>
        )}
        <div className="form-group col-lg-auto">
          <label>Start Time (UTC)</label>
          <input type="datetime-local" {...inputProps.dateStarted} />
        </div>
      </div>
      <div className="row">
        <div className={`form-group col-lg`}>
          <label>Type of Phase</label>
          <select {...inputProps.phase}>
            <option value="ramp">ramp</option>
            <option value="main">main (default)</option>
            <option value="holdout">holdout</option>
          </select>
        </div>
        <div className="form-group col-lg">
          <label>Percent of Traffic (0 to 1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            {...inputProps.coverage}
          />
        </div>
      </div>
      <div className="row">
        <div className="form-group col-md">
          <label>Traffic Split</label>
          <div className="row">
            {experiment.variations.map((v, i) => (
              <div className="col-auto mb-2" key={i}>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">{v.name}</div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    {...inputProps.variationWeights[i]}
                  />
                </div>
              </div>
            ))}
            <div className="col-auto">
              <button
                className="btn btn-outline-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  manualUpdate({
                    variationWeights: getEvenSplit(
                      experiment.variations.length
                    ),
                  });
                }}
              >
                Even Split
              </button>
            </div>
          </div>
          {!isValid && (
            <div className="alert alert-danger">
              The total traffic split must add up to 1
            </div>
          )}
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>Additional Targeting Rules (optional)</label>
          <TextareaAutosize
            {...inputProps.targeting}
            placeholder={`e.g. premium = true`}
            minRows={2}
            maxRows={5}
          />
          <small className="form-text text-muted">
            One targeting rule per line. Available operators: <code>=</code>,{" "}
            <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>,{" "}
            <code>~</code>, <code>!~</code>
          </small>
        </div>
      </div>
    </Modal>
  );
};

export default NewPhaseForm;